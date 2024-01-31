/*
 *  Copyright 2022 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const stripAnsi = require('strip-ansi');
const pjson = require('../../package.json');
const utils = require('../utils');
const {
  RP_EVENTS,
  RP_ENTITY_LAUNCH,
  LOG_LEVELS,
  STATUSES,
  CUCUMBER_MESSAGES,
  TEST_ITEM_TYPES,
} = require('../constants');
const Storage = require('../storage');

module.exports = {
  init() {
    this.storage = new Storage();
    this.customLaunchStatus = null;
    this.codeRefIndexesMap = new Map();

    this.options.eventBroadcaster.on('envelope', (event) => {
      const [key] = Object.keys(event);
      switch (key) {
        case CUCUMBER_MESSAGES.GHERKIN_DOCUMENT:
          return this.onGherkinDocumentEvent(event[key]);
        case CUCUMBER_MESSAGES.PICKLE:
          return this.onPickleEvent(event[key]);
        case CUCUMBER_MESSAGES.HOOK:
          return this.onHookEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_RUN_STARTED:
          return this.onTestRunStartedEvent();
        case CUCUMBER_MESSAGES.TEST_CASE:
          return this.onTestCaseEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_CASE_STARTED:
          return this.onTestCaseStartedEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_STEP_STARTED:
          return this.onTestStepStartedEvent(event[key]);
        case CUCUMBER_MESSAGES.ATTACHMENT:
          return this.onTestStepAttachmentEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_STEP_FINISHED:
          return this.onTestStepFinishedEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_CASE_FINISHED:
          return this.onTestCaseFinishedEvent(event[key]);
        case CUCUMBER_MESSAGES.TEST_RUN_FINISHED:
          return this.onTestRunFinishedEvent(event[key]);
        default:
          return null;
      }
    });
  },
  onGherkinDocumentEvent(data) {
    this.storage.setDocument(data);
    this.storage.setAstNodesData(data, utils.findAstNodesData(data.feature.children));
  },
  onHookEvent(data) {
    const { id } = data;
    this.storage.setHook(id, data);
  },
  onPickleEvent(data) {
    this.storage.setPickle(data);
  },
  onTestRunStartedEvent() {
    const attributes = [
      ...(this.config.attributes || []),
      { key: 'agent', value: `${pjson.name}|${pjson.version}`, system: true },
    ];
    if (this.config.skippedIssue === false) {
      const skippedIssueAttribute = { key: 'skippedIssue', value: 'false', system: true };
      attributes.push(skippedIssueAttribute);
    }
    const startLaunchData = {
      name: this.config.launch,
      startTime: this.reportportal.helpers.now(),
      description: this.config.description || '',
      attributes,
      rerun: this.isRerun,
      rerunOf: this.rerunOf,
      ...(this.config.mode && { mode: this.config.mode }),
    };
    const { tempId } = this.reportportal.startLaunch(startLaunchData);
    this.storage.setLaunchTempId(tempId);
  },
  onTestCaseEvent(data) {
    const { id: testCaseId, pickleId, testSteps } = data;
    this.storage.setTestCase({ id: testCaseId, pickleId, testSteps });

    // prepare steps
    const stepsMap = {};
    testSteps.forEach((step, index) => {
      const { pickleStepId, id, hookId } = step;

      if (pickleStepId) {
        const { steps: stepsData } = this.storage.getPickle(pickleId);
        const stepData = stepsData.find((item) => item.id === pickleStepId);
        stepsMap[id] = { ...stepData, type: TEST_ITEM_TYPES.STEP };
      } else if (hookId) {
        const isBeforeHook = index === 0;
        const { name } = this.storage.getHook(hookId);
        stepsMap[id] = {
          text: name || (isBeforeHook ? 'Before' : 'After'),
          type: isBeforeHook ? TEST_ITEM_TYPES.BEFORE_TEST : TEST_ITEM_TYPES.AFTER_TEST,
        };
      }
    });
    this.storage.setSteps(testCaseId, stepsMap);
  },
  onTestCaseStartedEvent(data) {
    const { id, testCaseId, attempt } = data;
    this.storage.setTestCaseStartedId(id, testCaseId);
    const { pickleId, isRetry: isTestCaseRetried } = this.storage.getTestCase(testCaseId);

    const {
      uri: pickleFeatureUri,
      astNodeIds: [scenarioId, parametersId],
    } = this.storage.getPickle(pickleId);
    const currentFeatureUri = this.storage.getCurrentFeatureUri();
    const feature = this.storage.getFeature(pickleFeatureUri);
    const launchTempId = this.storage.getLaunchTempId();
    const isNeedToStartFeature = currentFeatureUri !== pickleFeatureUri;

    // start FEATURE if no currentFeatureUri or new feature
    // else finish old one
    const featureCodeRef = utils.formatCodeRef(pickleFeatureUri, feature.name);
    if (isNeedToStartFeature) {
      const isFirstFeatureInLaunch = currentFeatureUri === null;
      const suiteData = {
        name: `${feature.keyword}: ${feature.name}`,
        startTime: this.reportportal.helpers.now(),
        type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.TEST : TEST_ITEM_TYPES.SUITE,
        description: (feature.description || '').trim(),
        attributes: utils.createAttributes(feature.tags),
        codeRef: featureCodeRef,
      };

      if (!isFirstFeatureInLaunch) {
        const previousFeatureTempId = this.storage.getFeatureTempId();
        this.reportportal.finishTestItem(previousFeatureTempId, {
          endTime: this.reportportal.helpers.now(),
        });
      }

      this.storage.setCurrentFeatureUri(pickleFeatureUri);
      const { tempId } = this.reportportal.startTestItem(suiteData, launchTempId, '');
      this.storage.setFeatureTempId(tempId);
    }

    // current feature node rule(this entity is for grouping several
    // scenarios in one logical block) || scenario
    const currentNode = utils.findNode(feature, scenarioId);

    let scenario;
    let ruleTempId;
    if (currentNode.rule) {
      ruleTempId = this.storage.getRuleTempId(currentNode.rule.id);

      if (!ruleTempId) {
        const { rule } = currentNode;

        const { name, description, tags, keyword, children = [], id: ruleId } = rule;
        const childrenIds = children.map((child) => child.scenario.id);
        const currentNodeCodeRef = utils.formatCodeRef(featureCodeRef, name);
        const testData = {
          startTime: this.reportportal.helpers.now(),
          type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.TEST : TEST_ITEM_TYPES.SUITE,
          name: `${keyword}: ${name}`,
          description,
          attributes: utils.createAttributes(tags),
          codeRef: currentNodeCodeRef,
        };
        const parentId = this.storage.getFeatureTempId();
        const { tempId } = this.reportportal.startTestItem(testData, launchTempId, parentId);
        ruleTempId = tempId;

        scenario = utils.findScenario(rule, scenarioId);

        this.storage.setRuleTempId(ruleId, ruleTempId);
        this.storage.setRuleTempIdToTestCase(id, ruleTempId);
        this.storage.setRuleChildrenIds(ruleTempId, childrenIds);
        this.storage.setStartedRuleChildrenIds(ruleTempId, scenarioId);
      } else {
        this.storage.setRuleTempIdToTestCase(id, ruleTempId);
        this.storage.setStartedRuleChildrenIds(ruleTempId, scenarioId);
        scenario = utils.findScenario(currentNode.rule, scenarioId);
      }
    } else {
      scenario = currentNode.scenario;
    }

    let isRetry = isTestCaseRetried;
    if (attempt > 0) {
      isRetry = true;
      this.storage.updateTestCase(testCaseId, { isRetry });

      // do not show scenario with retry in RP
      if (!this.isScenarioBasedStatistics) return;
    }

    const scenarioName = this.storage.getPickle(pickleId).name;
    const [keyword] = scenario.keyword.split(' ');

    const currentNodeCodeRef = utils.formatCodeRef(
      featureCodeRef,
      ruleTempId ? currentNode.rule.name : scenarioName,
    );
    const scenarioCodeRefIndexValue = this.codeRefIndexesMap.get(currentNodeCodeRef);
    this.codeRefIndexesMap.set(currentNodeCodeRef, (scenarioCodeRefIndexValue || 0) + 1);
    const name =
      scenarioCodeRefIndexValue && !isRetry
        ? `${scenarioName} [${scenarioCodeRefIndexValue}]`
        : scenarioName;
    const scenarioCodeRef =
      scenarioCodeRefIndexValue && !isRetry
        ? `${currentNodeCodeRef} [${scenarioCodeRefIndexValue}]`
        : currentNodeCodeRef;

    const testData = {
      startTime: this.reportportal.helpers.now(),
      type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.STEP : TEST_ITEM_TYPES.TEST,
      name: `${keyword}: ${name}`,
      description: scenario.description,
      attributes: utils.createAttributes(scenario.tags),
      codeRef: scenarioCodeRef,
      retry: this.isScenarioBasedStatistics && attempt > 0,
    };

    if (parametersId) {
      const [{ tableHeader, tableBody }] = scenario.examples;
      const params = utils.collectParams({ tableHeader, tableBody });
      Object.keys(params).forEach((paramKey) => {
        this.storage.setParameters(paramKey, params[paramKey]);
      });
      testData.parameters = this.storage.getParameters(parametersId);
    }
    const parentId = ruleTempId || this.storage.getFeatureTempId();
    const { tempId } = this.reportportal.startTestItem(testData, launchTempId, parentId);
    this.storage.setScenarioTempId(testCaseId, tempId);
    this.storage.updateTestCase(testCaseId, {
      codeRef: scenarioCodeRef,
    });
  },
  onTestStepStartedEvent(data) {
    const { testCaseStartedId, testStepId } = data;
    const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
    const testCase = this.storage.getTestCase(testCaseId);
    const step = this.storage.getStep(testCaseId, testStepId);

    // start step
    if (step) {
      const currentFeatureUri = this.storage.getCurrentFeatureUri();
      const astNodesData = this.storage.getAstNodesData(currentFeatureUri);

      const { text: stepName, type, astNodeIds } = step;
      const keyword =
        astNodeIds && (astNodesData.find(({ id }) => astNodeIds.includes(id)) || {}).keyword;

      const codeRef = utils.formatCodeRef(testCase.codeRef, stepName);
      const stepCodeRefIndexValue = this.codeRefIndexesMap.get(codeRef);
      this.codeRefIndexesMap.set(codeRef, (stepCodeRefIndexValue || 0) + 1);
      const name =
        stepCodeRefIndexValue && !testCase.isRetry
          ? `${stepName} [${stepCodeRefIndexValue}]`
          : stepName;

      const stepData = {
        name: keyword ? `${keyword} ${name}` : name,
        startTime: this.reportportal.helpers.now(),
        type,
        codeRef,
        hasStats: !this.isScenarioBasedStatistics,
        retry: !this.isScenarioBasedStatistics && !!testCase.isRetry,
      };

      if (!this.isScenarioBasedStatistics && step.astNodeIds && step.astNodeIds.length > 1) {
        const { testSteps } = testCase;
        const testStep = testSteps.find((item) => item.id === testStepId);
        const argumentsMap = testStep.stepMatchArgumentsLists[0].stepMatchArguments.map((arg) =>
          arg.group.value.slice(1, -1),
        );
        const parametersId = step.astNodeIds[1];
        const params = this.storage.getParameters(parametersId);
        stepData.parameters = params.filter((param) => argumentsMap.includes(param.value));
      }

      const launchTempId = this.storage.getLaunchTempId();
      const parentId = this.storage.getScenarioTempId(testCaseId);
      const { tempId } = this.reportportal.startTestItem(stepData, launchTempId, parentId);
      this.storage.setStepTempId(testStepId, tempId);
    }
  },
  onTestStepAttachmentEvent(data) {
    if (data) {
      const { testStepId, testCaseStartedId } = data;
      const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
      const step = this.storage.getStep(testCaseId, testStepId);
      const dataObj = utils.getJSON(data.body);

      switch (data.mediaType) {
        case RP_EVENTS.TEST_CASE_ID: {
          this.storage.updateStep(testCaseId, testStepId, dataObj);
          break;
        }
        case RP_EVENTS.ATTRIBUTES: {
          const savedAttributes = step.attributes || [];
          this.storage.updateStep(testCaseId, testStepId, {
            attributes: savedAttributes.concat(dataObj.attributes),
          });
          break;
        }
        case RP_EVENTS.DESCRIPTION: {
          const savedDescription = step.description || '';
          this.storage.updateStep(testCaseId, testStepId, {
            description: savedDescription
              ? `${savedDescription}<br/>${dataObj.description}`
              : dataObj.description,
          });
          break;
        }
        case RP_EVENTS.STATUS: {
          if (dataObj.entity !== RP_ENTITY_LAUNCH) {
            this.storage.updateStep(testCaseId, testStepId, dataObj);
          } else {
            this.customLaunchStatus = dataObj.status;
          }
          break;
        }
        case 'text/plain': {
          const request = {
            time: this.reportportal.helpers.now(),
          };
          let tempStepId = this.storage.getStepTempId(testStepId);

          if (dataObj) {
            request.level = dataObj.level;
            request.message = dataObj.message;
            if (dataObj.entity === RP_ENTITY_LAUNCH) {
              tempStepId = this.storage.getLaunchTempId();
            }
          } else {
            request.level = LOG_LEVELS.DEBUG;
            request.message = data.body;
          }
          this.reportportal.sendLog(tempStepId, request);
          break;
        }
        default: {
          const fileName = 'file'; // TODO: generate human valuable file name here if possible
          const request = {
            time: this.reportportal.helpers.now(),
            level: LOG_LEVELS.INFO,
            message: fileName,
            file: {
              name: fileName,
            },
          };
          let tempStepId = this.storage.getStepTempId(testStepId);

          if (dataObj) {
            if (dataObj.level) {
              request.level = dataObj.level;
            }
            request.message = dataObj.message;
            request.file.name = dataObj.message;
            if (dataObj.entity === RP_ENTITY_LAUNCH) {
              tempStepId = this.storage.getLaunchTempId();
            }
          }
          const fileObj = {
            name: fileName,
            type: data.mediaType,
            content: (dataObj && dataObj.data) || data.body,
          };
          this.reportportal.sendLog(tempStepId, request, fileObj);
          break;
        }
      }
    }
  },
  onTestStepFinishedEvent(data) {
    const { testCaseStartedId, testStepId, testStepResult } = data;
    const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
    const step = this.storage.getStep(testCaseId, testStepId);
    const tempStepId = this.storage.getStepTempId(testStepId);
    let status;

    switch (testStepResult.status.toLowerCase()) {
      case STATUSES.PASSED: {
        status = STATUSES.PASSED;
        break;
      }
      case STATUSES.PENDING: {
        this.reportportal.sendLog(tempStepId, {
          time: this.reportportal.helpers.now(),
          level: 'WARN',
          message: "This step is marked as 'pending'",
        });
        status = STATUSES.FAILED;
        break;
      }
      case STATUSES.UNDEFINED: {
        this.reportportal.sendLog(tempStepId, {
          time: this.reportportal.helpers.now(),
          level: 'ERROR',
          message: 'There is no step definition found. Please verify and implement it.',
        });
        status = STATUSES.FAILED;
        break;
      }
      case STATUSES.AMBIGUOUS: {
        this.reportportal.sendLog(tempStepId, {
          time: this.reportportal.helpers.now(),
          level: 'ERROR',
          message: 'There are more than one step implementation. Please verify and reimplement it.',
        });
        status = STATUSES.FAILED;
        break;
      }
      case STATUSES.SKIPPED: {
        status = STATUSES.SKIPPED;
        break;
      }
      case STATUSES.FAILED: {
        status = STATUSES.FAILED;
        this.reportportal.sendLog(tempStepId, {
          time: this.reportportal.helpers.now(),
          level: 'ERROR',
          message: stripAnsi(testStepResult.message),
        });

        const isBrowserAvailable = 'browser' in global;
        const isTakeScreenshotOptionProvidedInRPConfig =
          this.config.takeScreenshot && this.config.takeScreenshot === 'onFailure';

        if (isBrowserAvailable && isTakeScreenshotOptionProvidedInRPConfig) {
          const currentFeatureUri = this.storage.getCurrentFeatureUri();
          const astNodesData = this.storage.getAstNodesData(currentFeatureUri);
          const screenshotName = utils.getScreenshotName(astNodesData, step.astNodeIds);

          const request = {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            file: { name: screenshotName },
            message: screenshotName,
          };

          global.browser
            .takeScreenshot()
            .then((png) => {
              const screenshot = {
                name: screenshotName,
                type: 'image/png',
                content: png,
              };
              this.reportportal.sendLog(tempStepId, request, screenshot);
            })
            .catch((error) => {
              console.dir(error);
            });
        }
        break;
      }
      default:
        break;
    }

    if (step) {
      const { attributes, description = '', testCaseId: customTestCaseId } = step;
      status = step.status || status || testStepResult.status;
      const errorMessage =
        testStepResult.message && `\`\`\`error\n${stripAnsi(testStepResult.message)}\n\`\`\``;
      const descriptionToSend = errorMessage
        ? `${description}${description ? '\n' : ''}${errorMessage}`
        : description;
      const withoutIssue = status === STATUSES.SKIPPED && this.config.skippedIssue === false;
      this.reportportal.finishTestItem(tempStepId, {
        ...(status && { status }),
        ...(attributes && { attributes }),
        ...(descriptionToSend && { description: descriptionToSend }),
        ...(customTestCaseId && { testCaseId: customTestCaseId }),
        ...(withoutIssue && { issue: { issueType: 'NOT_ISSUE' } }),
        endTime: this.reportportal.helpers.now(),
      });
    }

    if (this.isScenarioBasedStatistics && status !== STATUSES.PASSED) {
      this.storage.updateTestCase(testCaseId, { status: STATUSES.FAILED });
    }

    this.storage.removeStepTempId(testStepId);
  },
  onTestCaseFinishedEvent({ testCaseStartedId, willBeRetried }) {
    const isNeedToFinishTestCase = !this.isScenarioBasedStatistics && willBeRetried;

    if (isNeedToFinishTestCase) {
      return;
    }

    const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
    const testCase = this.storage.getTestCase(testCaseId);
    const scenarioTempId = this.storage.getScenarioTempId(testCaseId);

    this.reportportal.finishTestItem(scenarioTempId, {
      endTime: this.reportportal.helpers.now(),
      ...(this.isScenarioBasedStatistics && { status: testCase.status || STATUSES.PASSED }),
    });

    // finish RULE if it's exist and if it's last scenario
    const ruleTempId = this.storage.getRuleTempIdToTestCase(testCaseStartedId);
    const ruleChildrenIds = this.storage.getRuleChildrenIds(ruleTempId);
    const startedRuleChildrenIds = this.storage.getStartedRuleChildrenIds(ruleTempId);
    const isAllRuleChildrenStarted = utils.isAllRuleChildrenStarted(
      ruleChildrenIds,
      startedRuleChildrenIds,
    );

    if (ruleTempId && isAllRuleChildrenStarted) {
      this.reportportal.finishTestItem(ruleTempId, {
        endTime: this.reportportal.helpers.now(),
      });

      this.storage.removeRuleTempIdToTestCase(testCaseStartedId);
      this.storage.removeStartedRuleChildrenIds(ruleTempId);
      this.storage.removeRuleChildrenIds(ruleTempId);
      this.codeRefIndexesMap.clear();
    }

    if (!willBeRetried) {
      this.storage.removeTestCaseStartedId(testCaseStartedId);
      this.storage.removeSteps(testCaseId);
      this.storage.removeTestCase(testCaseId);
      this.storage.removeScenarioTempId(testCaseStartedId);
    }
  },
  onTestRunFinishedEvent() {
    const featureTempId = this.storage.getFeatureTempId();
    this.reportportal.finishTestItem(featureTempId, {
      endTime: this.reportportal.helpers.now(),
    });

    const launchId = this.storage.getLaunchTempId();
    this.reportportal.getPromiseFinishAllItems(launchId).then(() => {
      this.reportportal.finishLaunch(launchId, {
        ...(this.customLaunchStatus && { status: this.customLaunchStatus }),
      });
      this.storage.setLaunchTempId(null);
      this.storage.setCurrentFeatureUri(null);
      this.storage.setFeatureTempId(null);
      this.customLaunchStatus = null;
    });
  },
};
