const pjson = require('../../package.json');
const utils = require('../utils');
const {
  RP_EVENTS,
  RP_ENTITY_LAUNCH,
  LOG_LEVELS,
  STATUSES,
  CUCUMBER_MESSAGES,
} = require('../constants');
const Storage = require('../storage');

module.exports = {
  init() {
    this.storage = new Storage();
    this.customLaunchStatus = null;

    this.options.eventBroadcaster.on('envelope', (event) => {
      const [key] = Object.keys(event);
      switch (key) {
        case CUCUMBER_MESSAGES.GHERKIN_DOCUMENT:
          return this.onGherkinDocumentEvent(event[key]);
        case CUCUMBER_MESSAGES.PICKLE:
          return this.onPickleEvent(event[key]);
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
  },
  onPickleEvent(data) {
    this.storage.setPickle(data);
  },
  onTestRunStartedEvent() {
    const startLaunchData = {
      name: this.config.launch,
      startTime: this.reportportal.helpers.now(),
      description: this.config.description || '',
      attributes: [
        ...this.attributesConf,
        { key: 'agent', value: `${pjson.name}|${pjson.version}`, system: true },
      ],
      rerun: this.isRerun,
      rerunOf: this.rerunOf,
    };
    const { tempId } = this.reportportal.startLaunch(startLaunchData);
    this.storage.setLaunchTempId(tempId);
  },
  onTestCaseEvent(data) {
    const { id: testCaseId, pickleId, testSteps } = data;
    this.storage.setTestCase(data);

    // prepare steps
    const stepsMap = {};
    testSteps.forEach((step) => {
      const { pickleStepId, id } = step;
      // skip hookId
      if (pickleStepId) {
        const { steps } = this.storage.getPickle(pickleId);
        stepsMap[id] = steps.find((item) => item.id === pickleStepId);
      }
    });
    this.storage.setSteps(testCaseId, stepsMap);
  },
  onTestCaseStartedEvent(data) {
    const { id, testCaseId } = data;
    this.storage.setTestCaseStartedId(id, testCaseId);
    const { pickleId } = this.storage.getTestCase(testCaseId);
    const {
      uri: pickleFeatureUri,
      astNodeIds: [scenarioId],
    } = this.storage.getPickle(pickleId);
    const currentFeatureUri = this.storage.getCurrentFeatureUri();
    const feature = this.storage.getFeature(pickleFeatureUri);
    const launchTempId = this.storage.getLaunchTempId();

    // start FEATURE if no currentFeatureUri or new feature
    // else finish old one
    if (!currentFeatureUri && currentFeatureUri !== pickleFeatureUri) {
      this.storage.setCurrentFeatureUri(pickleFeatureUri);
      const suiteData = {
        name: feature.name,
        startTime: this.reportportal.helpers.now(),
        type: 'SUITE',
        description: (feature.description || '').trim(),
        attributes: utils.createAttributes(feature.tags),
      };
      const { tempId } = this.reportportal.startTestItem(suiteData, launchTempId, '');
      this.storage.setFeatureTempId(tempId);
    } else {
      const tempFeatureId = this.storage.getFeatureTempId();
      this.reportportal.finishTestItem(tempFeatureId, {});
    }

    // current feature node rule || scenario
    const currentNode = utils.findNode(feature, scenarioId);

    let scenario;
    let ruleTempId = this.storage.getRuleTempId();
    if (currentNode.rule && !ruleTempId) {
      // start RULE
      const { rule } = currentNode;
      const testData = {
        startTime: this.reportportal.helpers.now(),
        type: 'SUITE',
        name: rule.name,
        description: rule.description,
        attributes: utils.createAttributes(rule.tags),
      };
      const parentId = this.storage.getFeatureTempId();
      const { tempId } = this.reportportal.startTestItem(testData, launchTempId, parentId);
      ruleTempId = tempId;
      this.storage.setRuleTempId(tempId);

      scenario = utils.findScenario(rule, scenarioId);
      const isLastScenario = utils.detectLastScenario(currentNode.rule, scenarioId);
      this.storage.setLastScenario(isLastScenario);
    } else if (currentNode.rule && ruleTempId) {
      scenario = utils.findScenario(currentNode.rule, scenarioId);
      const isLastScenario = utils.detectLastScenario(currentNode.rule, scenarioId);
      this.storage.setLastScenario(isLastScenario);
    } else {
      scenario = currentNode.scenario;
    }

    const testData = {
      startTime: this.reportportal.helpers.now(),
      type: 'TEST',
      name: scenario.name,
      description: scenario.description,
      attributes: utils.createAttributes(scenario.tags),
    };

    const parentId = ruleTempId || this.storage.getFeatureTempId();
    const { tempId } = this.reportportal.startTestItem(testData, launchTempId, parentId);
    this.storage.setScenarioTempId(tempId);
  },
  onTestStepStartedEvent(data) {
    const { testCaseStartedId, testStepId } = data;
    const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
    const step = this.storage.getStep(testCaseId, testStepId);

    // start step
    if (step) {
      const stepData = {
        name: step.text,
        startTime: this.reportportal.helpers.now(),
        type: 'STEP',
      };
      const launchTempId = this.storage.getLaunchTempId();
      const parentId = this.storage.getScenarioTempId();
      const { tempId } = this.reportportal.startTestItem(stepData, launchTempId, parentId);
      this.storage.setStepTempId(tempId);
    }
  },
  onTestStepAttachmentEvent(data) {
    if (data) {
      const { testStepId, testCaseStartedId } = data;
      const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
      const step = this.storage.getStep(testCaseId, testStepId);
      if (!step) return;
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
          let tempStepId = this.storage.getStepTempId();

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
          let tempStepId = this.storage.getStepTempId();

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
    if (!step) return;
    const tempStepId = this.storage.getStepTempId();
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
          message: testStepResult.message,
        });
        break;
      }
      default:
        break;
    }

    if (step) {
      const { attributes, description, testCaseId: customTestCaseId } = step;
      status = step.status || status || testStepResult.status;
      this.reportportal.finishTestItem(tempStepId, {
        ...(status && { status }),
        ...(attributes && { attributes }),
        ...(description && { description }),
        ...(customTestCaseId && { testCaseId: customTestCaseId }),
        endTime: this.reportportal.helpers.now(),
      });
    }

    this.storage.setStepTempId(null);
  },
  onTestCaseFinishedEvent(data) {
    const { testCaseStartedId } = data;
    const scenarioTempId = this.storage.getScenarioTempId();
    this.reportportal.finishTestItem(scenarioTempId, {});

    // finish RULE if it's exist and if it's last scenario
    const isLastScenario = this.storage.getLastScenario();
    const ruleTempId = this.storage.getRuleTempId();
    if (ruleTempId && isLastScenario) {
      this.reportportal.finishTestItem(ruleTempId, {});
      this.storage.setRuleTempId(null);
      this.storage.setLastScenario(false);
    }

    const testCaseId = this.storage.getTestCaseId(testCaseStartedId);
    this.storage.removeTestCaseStartedId(testCaseStartedId);
    this.storage.removeSteps(testCaseId);
    this.storage.removeTestCase(testCaseId);
    this.storage.setScenarioTempId(null);
  },
  onTestRunFinishedEvent() {
    const featureTempId = this.storage.getFeatureTempId();
    this.reportportal.finishTestItem(featureTempId, {});

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
