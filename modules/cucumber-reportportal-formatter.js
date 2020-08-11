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

const { Formatter } = require('cucumber');
const ReportPortalClient = require('@reportportal/client-javascript');
const utils = require('./utils');
const Context = require('./context');
const DocumentStorage = require('./documents-storage');
const itemFinders = require('./itemFinders');
const pjson = require('../package.json');
const {
  AFTER_HOOK_URI_TO_SKIP,
  RP_ENTITY_LAUNCH,
  STATUSES,
  LOG_LEVELS,
  CUCUMBER_EVENTS,
  RP_EVENTS,
} = require('./constants');

const createRPFormatterClass = (config) => {
  const documentsStorage = new DocumentStorage();
  const reportportal = new ReportPortalClient(config, { name: pjson.name, version: pjson.version });
  const attributesConf = !config.attributes ? [] : config.attributes;
  const isScenarioBasedStatistics = utils.isScenarioBasedStatistics(config);

  return class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);
      this.contextState = new Context();
      this.documentsStorage = documentsStorage;
      this.reportportal = reportportal;
      this.attributesConf = attributesConf;
      this.isScenarioBasedStatistics = isScenarioBasedStatistics;

      const { rerun, rerunOf } = options.parsedArgvOptions || {};

      this.isRerun = rerun || config.rerun;
      this.rerunOf = rerunOf || config.rerunOf;

      this.registerListeners(options.eventBroadcaster);
    }

    registerListeners(eventBroadcaster) {
      eventBroadcaster.on(
        CUCUMBER_EVENTS.GHERKIN_DOCUMENT,
        this.onGherkinDocument.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.PICKLE_ACCEPTED,
        this.onPickleAccepted.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_CASE_PREPARED,
        this.onTestCasePrepared.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_CASE_STARTED,
        this.onTestCaseStarted.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_STEP_STARTED,
        this.onTestStepStarted.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_STEP_FINISHED,
        this.onTestStepFinished.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_STEP_ATTACHMENT,
        this.onTestStepAttachment.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_CASE_FINISHED,
        this.onTestCaseFinished.bind(this),
      );
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_RUN_FINISHED,
        this.onTestRunFinished.bind(this),
      );
    }

    onGherkinDocument(event) {
      this.documentsStorage.cacheDocument(event);

      // BeforeFeatures
      if (!this.contextState.context.launchId) {
        const launch = this.reportportal.startLaunch({
          name: config.launch,
          startTime: this.reportportal.helpers.now(),
          description: !config.description ? '' : config.description,
          attributes: [
            ...this.attributesConf,
            { key: 'agent', value: `${pjson.name}|${pjson.version}`, system: true },
          ],
          rerun: this.isRerun,
          rerunOf: this.rerunOf,
        });
        this.contextState.context.launchId = launch.tempId;
      }
    }

    onPickleAccepted(event) {
      const isPickleCached = this.documentsStorage.isAcceptedPickleCached(event);

      if (!isPickleCached) {
        this.documentsStorage.cacheAcceptedPickle(event);

        const featureDocument = itemFinders.findFeature(
          this.documentsStorage.gherkinDocuments,
          event,
        );
        const featureUri = utils.getUri(event.uri);
        const description = featureDocument.description ? featureDocument.description : featureUri;
        const { name } = featureDocument;
        const itemAttributes = utils.createAttributes(featureDocument.tags);

        let total = featureDocument.children.length;
        let parameters = [];
        featureDocument.children.forEach((child) => {
          if (child.examples) {
            child.examples.forEach((ex) => {
              total += ex.tableBody.length - 1;
              parameters = parameters.concat(utils.getParameters(ex.tableHeader, ex.tableBody));
            });
          }
        });

        this.contextState.context.background = itemFinders.findBackground(featureDocument);
        if (this.contextState.context.background) {
          total -= 1;
        }

        this.contextState.context.scenariosCount[featureUri] = { total, done: 0 };

        // BeforeFeature
        const featureId = this.reportportal.startTestItem(
          {
            name,
            startTime: this.reportportal.helpers.now(),
            type: this.isScenarioBasedStatistics ? 'TEST' : 'SUITE',
            codeRef: utils.formatCodeRef(event.uri, name),
            parameters,
            description,
            attributes: itemAttributes,
          },
          this.contextState.context.launchId,
        ).tempId;

        this.documentsStorage.pickleDocuments[event.uri].featureId = featureId;
      }
    }

    onTestCasePrepared(event) {
      this.contextState.context.stepDefinitions = event;
      this.contextState.context.isBeforeHook = true;
    }

    onTestCaseStarted(event) {
      const featureDocument = itemFinders.findFeature(
        this.documentsStorage.gherkinDocuments,
        event.sourceLocation,
      );
      this.contextState.context.scenario = itemFinders.findScenario(
        this.documentsStorage.gherkinDocuments,
        event.sourceLocation,
      );
      this.contextState.context.background = itemFinders.findBackground(featureDocument);
      const featureTags = featureDocument.tags;
      const pickle = this.documentsStorage.pickleDocuments[utils.getUri(event.sourceLocation.uri)];
      const keyword = this.contextState.context.scenario.keyword
        ? this.contextState.context.scenario.keyword
        : this.contextState.context.scenario.type;
      let name = [keyword, this.contextState.context.scenario.name].join(': ');
      const pickleTags = pickle.tags
        ? pickle.tags.filter((tag) => !featureTags.find(utils.createTagComparator(tag)))
        : [];
      const itemAttributes = utils.createAttributes(pickleTags);
      const description =
        this.contextState.context.scenario.description ||
        [utils.getUri(event.sourceLocation.uri), event.sourceLocation.line].join(':');
      const { featureId } = this.documentsStorage.pickleDocuments[event.sourceLocation.uri];

      if (this.contextState.context.lastScenarioDescription !== name) {
        this.contextState.context.lastScenarioDescription = name;
        this.contextState.context.outlineRow = 0;
      } else if (event.attemptNumber < 2) {
        this.contextState.context.outlineRow += 1;
        name += ` [${this.contextState.context.outlineRow}]`;
      }

      // BeforeScenario
      if (this.isScenarioBasedStatistics || event.attemptNumber < 2) {
        this.contextState.context.scenarioId = this.reportportal.startTestItem(
          {
            name,
            startTime: this.reportportal.helpers.now(),
            type: this.isScenarioBasedStatistics ? 'STEP' : 'TEST',
            description,
            codeRef: utils.formatCodeRef(event.sourceLocation.uri, name),
            parameters: this.contextState.context.scenario.parameters,
            attributes: itemAttributes,
            retry: false,
          },
          this.contextState.context.launchId,
          featureId,
        ).tempId;
      }
    }

    onTestStepStarted(event) {
      this.contextState.context.stepStatus = 'failed';
      this.contextState.context.stepId = null;

      this.contextState.context.stepSourceLocation = this.contextState.context.stepDefinitions.steps[
        event.index
      ];

      // skip After Hook added by protractor-cucumber-framework
      if (
        !this.contextState.context.stepSourceLocation.sourceLocation &&
        this.contextState.context.stepSourceLocation.actionLocation.uri.includes(
          AFTER_HOOK_URI_TO_SKIP,
        )
      )
        return;

      this.contextState.context.step = this.contextState.findStep(event);
      this.contextState.context.stepDefinition = itemFinders.findStepDefinition(
        this.contextState.context,
        event,
      );

      const name = this.contextState.context.step.text
        ? `${this.contextState.context.step.keyword} ${this.contextState.context.step.text}`
        : this.contextState.context.step.keyword;
      let type = 'STEP';
      let isHook = false;
      if (this.contextState.context.step.keyword === 'Before') {
        type = 'BEFORE_TEST';
        isHook = true;
      } else if (this.contextState.context.step.keyword === 'After') {
        type = 'AFTER_TEST';
        isHook = true;
      }

      // hooks are described in cucumber's library core
      const codeRef =
        this.contextState.context.stepDefinition && !isHook
          ? utils.formatCodeRef(this.contextState.context.stepDefinition.uri, name)
          : undefined;

      this.contextState.context.stepId = this.reportportal.startTestItem(
        {
          name,
          startTime: this.reportportal.helpers.now(),
          type,
          codeRef,
          parameters: this.contextState.context.step.parameters,
          hasStats: !this.isScenarioBasedStatistics,
          retry: !this.isScenarioBasedStatistics && event.testCase.attemptNumber > 1,
        },
        this.contextState.context.launchId,
        this.contextState.context.scenarioId,
      ).tempId;
    }

    onTestStepFinished(event) {
      // skip After Hook added by protractor-cucumber-framework
      if (
        !this.contextState.context.stepSourceLocation.sourceLocation &&
        this.contextState.context.stepSourceLocation.actionLocation.uri.includes(
          AFTER_HOOK_URI_TO_SKIP,
        )
      )
        return;

      // StepResult
      const sceenshotName = this.contextState.getFileName();

      switch (event.result.status) {
        case STATUSES.PASSED: {
          this.contextState.context.stepStatus = STATUSES.PASSED;
          this.contextState.context.scenarioStatus = STATUSES.PASSED;
          break;
        }
        case STATUSES.PENDING: {
          this.reportportal.sendLog(this.contextState.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'WARN',
            message: "This step is marked as 'pending'",
          });
          this.contextState.context.stepStatus = STATUSES.NOT_IMPLEMENTED;
          this.contextState.context.scenarioStatus = STATUSES.FAILED;
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.UNDEFINED: {
          this.reportportal.sendLog(this.contextState.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            message: 'There is no step definition found. Please verify and implement it.',
          });
          this.contextState.context.stepStatus = STATUSES.NOT_FOUND;
          this.contextState.context.scenarioStatus = STATUSES.FAILED;
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.AMBIGUOUS: {
          this.reportportal.sendLog(this.contextState.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            message:
              'There are more than one step implementation. Please verify and reimplement it.',
          });
          this.contextState.context.stepStatus = STATUSES.NOT_FOUND;
          this.contextState.context.scenarioStatus = STATUSES.FAILED;
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.SKIPPED: {
          this.contextState.context.stepStatus = STATUSES.SKIPPED;
          if (this.contextState.context.scenarioStatus === STATUSES.FAILED) {
            this.contextState.context.scenarioStatus = STATUSES.SKIPPED;
          }
          break;
        }
        case STATUSES.FAILED: {
          this.contextState.context.stepStatus = STATUSES.FAILED;
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          const errorMessage = `${
            this.contextState.context.stepDefinition.uri
          }\n ${event.result.exception.toString()}`;
          this.reportportal.sendLog(this.contextState.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            message: errorMessage,
          });
          if (global.browser && config.takeScreenshot && config.takeScreenshot === 'onFailure') {
            const request = {
              time: this.reportportal.helpers.now(),
              level: 'ERROR',
              file: { name: sceenshotName },
              message: sceenshotName,
            };
            global.browser.takeScreenshot().then((png) => {
              const fileObj = {
                name: sceenshotName,
                type: 'image/png',
                content: png,
              };
              this.reportportal.sendLog(this.contextState.context.stepId, request, fileObj);
            });
          }
          break;
        }
        default:
          break;
      }

      const itemParams = this.contextState.context.itemsParams[this.contextState.context.stepId];

      // AfterStep
      const request = {
        status: this.contextState.context.stepStatus,
        endTime: this.reportportal.helpers.now(),
        ...itemParams,
      };
      if (request.status === STATUSES.NOT_FOUND) {
        request.status = STATUSES.FAILED;
        request.issue = {
          issueType: 'ab001',
          comment: 'STEP DEFINITION WAS NOT FOUND',
        };
      } else if (request.status === STATUSES.NOT_IMPLEMENTED) {
        request.status = STATUSES.SKIPPED;
        request.issue = {
          issueType: 'ti001',
          comment: 'STEP IS PENDING IMPLEMENTATION',
        };
      }

      this.reportportal.finishTestItem(this.contextState.context.stepId, request);
    }

    updateItemParams(id, newParams) {
      this.contextState.context.itemsParams[id] = {
        ...this.contextState.context.itemsParams[id],
        ...newParams,
      };
    }

    getItemParams(id) {
      return this.contextState.context.itemsParams[id] || {};
    }

    onTestStepAttachment(event) {
      const fileName = this.contextState.getFileName();
      if (
        event.data &&
        event.data.length &&
        (this.contextState.context.stepStatus === STATUSES.PASSED ||
          this.contextState.context.stepStatus === STATUSES.FAILED)
      ) {
        const dataObj = utils.getJSON(event.data);
        let itemId = this.contextState.context.stepId;

        switch (event.media.type) {
          case RP_EVENTS.TEST_CASE_ID: {
            this.updateItemParams(itemId, { testCaseId: dataObj.testCaseId });
            break;
          }
          case RP_EVENTS.ATTRIBUTES: {
            const savedAttributes = this.getItemParams(itemId).attributes || [];
            this.updateItemParams(itemId, {
              attributes: savedAttributes.concat(dataObj.attributes),
            });
            break;
          }
          case RP_EVENTS.DESCRIPTION: {
            const savedDescription = this.getItemParams(itemId).description || '';
            this.updateItemParams(itemId, {
              description: savedDescription
                ? `${savedDescription}<br/>${dataObj.description}`
                : dataObj.description,
            });
            break;
          }
          case RP_EVENTS.STATUS: {
            if (dataObj.entity !== RP_ENTITY_LAUNCH) {
              this.updateItemParams(itemId, {
                status: dataObj.status,
              });
            } else {
              this.contextState.context.launchStatus = dataObj.status;
            }
            break;
          }
          case 'text/plain': {
            const request = {
              time: this.reportportal.helpers.now(),
            };
            if (dataObj) {
              request.level = dataObj.level;
              request.message = dataObj.message;
              if (dataObj.entity === RP_ENTITY_LAUNCH) {
                itemId = this.contextState.context.launchId;
              }
            } else {
              request.level = LOG_LEVELS.DEBUG;
              request.message = event.data;
            }
            this.reportportal.sendLog(itemId, request);
            break;
          }
          default: {
            const request = {
              time: this.reportportal.helpers.now(),
              level:
                this.contextState.context.stepStatus === STATUSES.PASSED
                  ? LOG_LEVELS.DEBUG
                  : LOG_LEVELS.ERROR,
              message: fileName,
              file: {
                name: fileName,
              },
            };
            if (dataObj) {
              request.level = dataObj.level;
              request.message = dataObj.message;
              request.file.name = dataObj.message;
              if (dataObj.entity === RP_ENTITY_LAUNCH) {
                itemId = this.contextState.context.launchId;
              }
            }
            const fileObj = {
              name: fileName,
              type: event.media.type,
              content: (dataObj && dataObj.data) || event.data,
            };
            this.reportportal.sendLog(itemId, request, fileObj);
            break;
          }
        }
      }
    }

    onTestCaseFinished(event) {
      if (!this.isScenarioBasedStatistics && event.result.retried) {
        return;
      }
      const isFailed = event.result.status.toUpperCase() !== 'PASSED';
      // ScenarioResult
      this.reportportal.finishTestItem(this.contextState.context.scenarioId, {
        status: isFailed ? STATUSES.FAILED : STATUSES.PASSED,
        endTime: this.reportportal.helpers.now(),
      });
      this.contextState.context.scenarioStatus = STATUSES.FAILED;
      this.contextState.context.scenarioId = null;

      const featureUri = event.sourceLocation.uri;
      if (!event.result.retried) {
        this.contextState.context.scenariosCount[featureUri].done += 1;
      }
      const { total, done } = this.contextState.context.scenariosCount[featureUri];
      if (done === total) {
        const featureStatus =
          this.contextState.context.failedScenarios[featureUri] > 0
            ? STATUSES.FAILED
            : STATUSES.PASSED;
        this.reportportal.finishTestItem(
          this.documentsStorage.pickleDocuments[featureUri].featureId,
          {
            status: featureStatus,
            endTime: this.reportportal.helpers.now(),
          },
        );
      }
    }

    onTestRunFinished() {
      // AfterFeatures
      const promise = this.reportportal.getPromiseFinishAllItems(
        this.contextState.context.launchId,
      );
      return promise.then(() => {
        if (this.contextState.context.launchId) {
          const launchFinishPromise = this.reportportal.finishLaunch(
            this.contextState.context.launchId,
            {
              endTime: this.reportportal.helpers.now(),
            },
          ).promise;
          launchFinishPromise.then(() => {
            this.contextState.resetContext();
          });
        }
      });
    }
  };
};

module.exports = { createRPFormatterClass };
