/*
 *  Copyright 2020 EPAM Systems
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

const ReportPortalClient = require('@reportportal/client-javascript');
const clientHelpers = require('@reportportal/client-javascript/lib/helpers');
const { Formatter } = require('@cucumber/cucumber');
const stripAnsi = require('strip-ansi');
const utils = require('./utils');
const pjson = require('../package.json');
const {
  RP_EVENTS,
  RP_ENTITIES,
  LOG_LEVELS,
  STATUSES,
  CUCUMBER_MESSAGES,
  TEST_STEP_FINISHED_RP_MESSAGES,
  TEST_ITEM_TYPES,
} = require('./constants');
const Storage = require('./storage');

const createRPFormatterClass = (config) =>
  class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);

      this.options = options;
      this.config = config;
      this.reportportal = new ReportPortalClient(config, {
        name: pjson.name,
        version: pjson.version,
      });
      const { rerun, rerunOf } = options.parsedArgvOptions || {};
      this.isRerun = rerun || config.rerun;
      this.rerunOf = rerunOf || config.rerunOf;
      this.isScenarioBasedStatistics =
        typeof this.config.scenarioBasedStatistics === 'boolean'
          ? this.config.scenarioBasedStatistics
          : false;
      this.storage = new Storage();
      this.customLaunchStatus = null;
      this.codeRefIndexesMap = new Map();

      this.options.eventBroadcaster.on('envelope', this.eventHandler.bind(this));
    }

    eventHandler(event) {
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
    }

    onGherkinDocumentEvent(data) {
      this.storage.setFeature(data.uri, data.feature);
      this.storage.setAstNodesData(data, utils.findAstNodesData(data.feature.children));
    }

    onHookEvent(data) {
      const { id } = data;
      this.storage.setHook(id, data);
    }

    onPickleEvent(data) {
      this.storage.setPickle(data);
    }

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
        startTime: clientHelpers.now(),
        description: this.config.description || '',
        attributes,
        rerun: this.isRerun,
        rerunOf: this.rerunOf,
        id: this.config.launchId,
        ...(this.config.mode && { mode: this.config.mode }),
      };
      const { tempId } = this.reportportal.startLaunch(startLaunchData);
      this.storage.setLaunchTempId(tempId);
    }

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
    }

    startFeature({ pickleFeatureUri, feature }) {
      if (this.storage.getFeatureTempId(pickleFeatureUri)) return;

      const launchTempId = this.storage.getLaunchTempId();
      const suiteData = {
        name: `${feature.keyword}: ${feature.name}`,
        startTime: clientHelpers.now(),
        type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.TEST : TEST_ITEM_TYPES.SUITE,
        description: (feature.description || '').trim(),
        attributes: utils.createAttributes(feature.tags),
        codeRef: utils.formatCodeRef(pickleFeatureUri, feature.name),
      };

      const { tempId } = this.reportportal.startTestItem(suiteData, launchTempId);
      this.storage.updateFeature(pickleFeatureUri, { tempId });
    }

    finishFeature(pickleFeatureUri) {
      const { tempId, endTime } = this.storage.getFeature(pickleFeatureUri);

      this.reportportal.finishTestItem(tempId, {
        endTime: endTime || clientHelpers.now(),
      });

      this.storage.deleteFeature(pickleFeatureUri);
    }

    onTestCaseStartedEvent(data) {
      const { id, testCaseId, attempt } = data;
      this.storage.setTestCaseStartedId(id, testCaseId);
      const { pickleId, isRetry: isTestCaseRetried } = this.storage.getTestCase(testCaseId);

      const {
        uri: pickleFeatureUri,
        astNodeIds: [scenarioId, parametersId],
      } = this.storage.getPickle(pickleId);
      const feature = this.storage.getFeature(pickleFeatureUri);
      const launchTempId = this.storage.getLaunchTempId();
      const featureCodeRef = utils.formatCodeRef(pickleFeatureUri, feature.name);
      this.startFeature({ pickleFeatureUri, feature });

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
            startTime: clientHelpers.now(),
            type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.TEST : TEST_ITEM_TYPES.SUITE,
            name: `${keyword}: ${name}`,
            description,
            attributes: utils.createAttributes(tags),
            codeRef: currentNodeCodeRef,
          };
          const parentId = this.storage.getFeatureTempId(pickleFeatureUri);
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

      const { name: scenarioName } = scenario;
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
      const scenarioAttributes = utils.createAttributes(scenario.tags);
      const testData = {
        startTime: clientHelpers.now(),
        type: this.isScenarioBasedStatistics ? TEST_ITEM_TYPES.STEP : TEST_ITEM_TYPES.TEST,
        name: `${keyword}: ${name}`,
        description: scenario.description,
        attributes: scenarioAttributes,
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
      const parentId = ruleTempId || this.storage.getFeatureTempId(pickleFeatureUri);
      const { tempId } = this.reportportal.startTestItem(testData, launchTempId, parentId);
      this.storage.setScenario(testCaseId, {
        tempId,
        description: scenario.description,
        attributes: scenarioAttributes,
      });
      this.storage.updateTestCase(testCaseId, {
        codeRef: scenarioCodeRef,
      });
    }

    onTestStepStartedEvent(data) {
      const { testCaseStartedId, testStepId } = data;
      const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
      const testCase = this.storage.getTestCase(testCaseId);
      const step = this.storage.getStep(testCaseId, testStepId);

      // start step
      if (step) {
        const currentFeatureUri = (this.storage.getPickle(testCase.pickleId) || {}).uri;
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
          startTime: clientHelpers.now(),
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
    }

    onTestStepAttachmentEvent(data) {
      if (data) {
        const { testStepId, testCaseStartedId } = data;
        const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
        const scenario = this.storage.getScenario(testCaseId) || {};
        const step = this.storage.getStep(testCaseId, testStepId);
        const dataObj = utils.getJSON(data.body);

        switch (data.mediaType) {
          case RP_EVENTS.STEP_TEST_CASE_ID:
          case RP_EVENTS.STEP_STATUS: {
            this.storage.updateStep(testCaseId, testStepId, dataObj);
            break;
          }
          case RP_EVENTS.STEP_ATTRIBUTES: {
            const savedAttributes = step.attributes || [];
            this.storage.updateStep(testCaseId, testStepId, {
              attributes: savedAttributes.concat(dataObj.attributes),
            });
            break;
          }
          case RP_EVENTS.STEP_DESCRIPTION: {
            const savedDescription = step.description || '';
            this.storage.updateStep(testCaseId, testStepId, {
              description: savedDescription
                ? `${savedDescription}<br/>${dataObj.description}`
                : dataObj.description,
            });
            break;
          }

          case RP_EVENTS.SCENARIO_TEST_CASE_ID:
          case RP_EVENTS.SCENARIO_STATUS: {
            this.storage.updateScenario(testCaseId, dataObj);
            break;
          }
          case RP_EVENTS.SCENARIO_ATTRIBUTES: {
            const savedAttributes = scenario.attributes || [];
            this.storage.updateScenario(testCaseId, {
              attributes: savedAttributes.concat(dataObj.attributes),
            });
            break;
          }
          case RP_EVENTS.SCENARIO_DESCRIPTION: {
            const savedDescription = scenario.description || '';
            this.storage.updateScenario(testCaseId, {
              description: savedDescription
                ? `${savedDescription}<br/>${dataObj.description}`
                : dataObj.description,
            });
            break;
          }

          case RP_EVENTS.LAUNCH_STATUS: {
            this.customLaunchStatus = dataObj.status;
            break;
          }

          case 'text/plain': {
            const request = {
              time: clientHelpers.now(),
            };
            let tempId = this.storage.getStepTempId(testStepId);

            if (dataObj) {
              request.level = dataObj.level;
              request.message = dataObj.message;

              if (dataObj.entity === RP_ENTITIES.LAUNCH) {
                tempId = this.storage.getLaunchTempId();
              } else if (dataObj.entity === RP_ENTITIES.SCENARIO) {
                tempId = this.storage.getScenarioTempId(testCaseId);
              }
            } else {
              request.level = LOG_LEVELS.DEBUG;
              request.message = data.body;
            }
            this.reportportal.sendLog(tempId, request);
            break;
          }
          default: {
            const fileName = 'file'; // TODO: generate human valuable file name here if possible
            const request = {
              time: clientHelpers.now(),
              level: LOG_LEVELS.INFO,
              message: fileName,
              file: {
                name: fileName,
              },
            };
            let tempId = this.storage.getStepTempId(testStepId);

            if (dataObj) {
              if (dataObj.level) {
                request.level = dataObj.level;
              }
              request.message = dataObj.message;
              request.file.name = dataObj.message;

              if (dataObj.entity === RP_ENTITIES.LAUNCH) {
                tempId = this.storage.getLaunchTempId();
              } else if (dataObj.entity === RP_ENTITIES.SCENARIO) {
                tempId = this.storage.getScenarioTempId(testCaseId);
              }
            }
            const fileObj = {
              name: fileName,
              type: data.mediaType,
              content: (dataObj && dataObj.data) || data.body,
            };
            this.reportportal.sendLog(tempId, request, fileObj);
            break;
          }
        }
      }
    }

    onTestStepFinishedEvent(data) {
      const { testCaseStartedId, testStepId, testStepResult } = data;
      const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
      const testCase = this.storage.getTestCase(testCaseId);
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
            time: clientHelpers.now(),
            level: LOG_LEVELS.WARN,
            message: TEST_STEP_FINISHED_RP_MESSAGES.PENDING,
          });
          status = STATUSES.FAILED;
          break;
        }
        case STATUSES.UNDEFINED: {
          this.reportportal.sendLog(tempStepId, {
            time: clientHelpers.now(),
            level: LOG_LEVELS.ERROR,
            message: TEST_STEP_FINISHED_RP_MESSAGES.UNDEFINED,
          });
          status = STATUSES.FAILED;
          break;
        }
        case STATUSES.AMBIGUOUS: {
          this.reportportal.sendLog(tempStepId, {
            time: clientHelpers.now(),
            level: LOG_LEVELS.ERROR,
            message: TEST_STEP_FINISHED_RP_MESSAGES.AMBIGUOUS,
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
            time: clientHelpers.now(),
            level: LOG_LEVELS.ERROR,
            message: stripAnsi(testStepResult.message),
          });

          const isBrowserAvailable = 'browser' in global;
          const isTakeScreenshotOptionProvidedInRPConfig =
            this.config.takeScreenshot && this.config.takeScreenshot === 'onFailure';

          if (isBrowserAvailable && isTakeScreenshotOptionProvidedInRPConfig) {
            const currentFeatureUri = (this.storage.getPickle(testCase.pickleId) || {}).uri;
            const astNodesData = this.storage.getAstNodesData(currentFeatureUri);
            const screenshotName = utils.getScreenshotName(astNodesData, step.astNodeIds);

            const request = {
              time: clientHelpers.now(),
              level: LOG_LEVELS.ERROR,
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
          endTime: clientHelpers.now(),
        });
      }

      if (this.isScenarioBasedStatistics && status !== STATUSES.PASSED) {
        this.storage.updateTestCase(testCaseId, { status: STATUSES.FAILED });
      }

      this.storage.removeStepTempId(testStepId);
    }

    onTestCaseFinishedEvent({ testCaseStartedId, willBeRetried }) {
      const isNeedToFinishTestCase = !this.isScenarioBasedStatistics && willBeRetried;

      if (isNeedToFinishTestCase) {
        return;
      }

      const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
      const testCase = this.storage.getTestCase(testCaseId);
      const {
        tempId: scenarioTempId,
        status: scenarioStatus,
        testCaseId: customTestCaseId,
        attributes,
        description,
      } = this.storage.getScenario(testCaseId);

      this.reportportal.finishTestItem(scenarioTempId, {
        endTime: clientHelpers.now(),
        ...(this.isScenarioBasedStatistics && {
          status: scenarioStatus || testCase.status || STATUSES.PASSED,
        }),
        ...(this.isScenarioBasedStatistics && customTestCaseId && { testCaseId: customTestCaseId }),
        ...(attributes && { attributes }),
        ...(description && { description }),
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
          endTime: clientHelpers.now(),
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
        this.storage.removeScenario(testCaseStartedId);
      }

      const { uri: pickleFeatureUri } = this.storage.getPickle(testCase.pickleId);
      this.storage.updateFeature(pickleFeatureUri, { endTime: clientHelpers.now() });
    }

    onTestRunFinishedEvent() {
      const featureUris = this.storage.getActiveFeatureUris();
      featureUris.forEach((featureUri) => {
        this.finishFeature(featureUri);
      });

      const launchId = this.storage.getLaunchTempId();
      this.reportportal.getPromiseFinishAllItems(launchId).then(() => {
        if (!this.config.launchId) {
          this.reportportal.finishLaunch(launchId, {
            ...(this.customLaunchStatus && { status: this.customLaunchStatus }),
          });
        }
        this.storage.setLaunchTempId(null);
        this.customLaunchStatus = null;
      });
    }
  };

module.exports = { createRPFormatterClass };
