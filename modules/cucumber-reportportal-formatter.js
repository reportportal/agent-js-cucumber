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
const Table = require('cli-table3');
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
  TABLE_CONFIG,
} = require('./constants');

const createRPFormatterClass = (config) => {
  const documentsStorage = new DocumentStorage();
  const reportportal = new ReportPortalClient(config, { name: pjson.name, version: pjson.version });
  const attributesConf = !config.attributes ? [] : config.attributes;
  const isScenarioBasedStatistics =
    typeof config.scenarioBasedStatistics === 'boolean' ? config.scenarioBasedStatistics : false;

  return class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);
      this.context = new Context();
      this.documentsStorage = documentsStorage;
      this.reportportal = reportportal;
      this.attributesConf = attributesConf;

      const { rerun, rerunOf, isLaunchMergeRequired } = options.parsedArgvOptions || {};

      this.isRerun = rerun || config.rerun;
      this.rerunOf = rerunOf || config.rerunOf;
      this.isLaunchMergeRequired = isLaunchMergeRequired || config.isLaunchMergeRequired;

      this.registerListeners(options.eventBroadcaster);
    }

    registerListeners(eventBroadcaster) {
      eventBroadcaster.on(CUCUMBER_EVENTS.GHERKIN_DOCUMENT, this.onGherkinDocument.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.PICKLE_ACCEPTED, this.onPickleAccepted.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_CASE_PREPARED, this.onTestCasePrepared.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_CASE_STARTED, this.onTestCaseStarted.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_STEP_STARTED, this.onTestStepStarted.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_STEP_FINISHED, this.onTestStepFinished.bind(this));
      eventBroadcaster.on(
        CUCUMBER_EVENTS.TEST_STEP_ATTACHMENT,
        this.onTestStepAttachment.bind(this),
      );
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_CASE_FINISHED, this.onTestCaseFinished.bind(this));
      eventBroadcaster.on(CUCUMBER_EVENTS.TEST_RUN_FINISHED, this.onTestRunFinished.bind(this));
    }

    onGherkinDocument(event) {
      this.documentsStorage.cacheDocument(event);

      // BeforeFeatures
      if (!this.context.launchId) {
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
          isLaunchMergeRequired: this.isLaunchMergeRequired
        });
        this.context.launchId = launch.tempId;
      }
    }

    onPickleAccepted(event) {
      const featureUri = utils.getUri(event.uri);
      if (!this.documentsStorage.isFeatureDataCached(featureUri)) {
        this.documentsStorage.createCachedFeature(featureUri);

        const feature = this.documentsStorage.featureData[featureUri];
        const featureDocument = itemFinders.findFeature(
          this.documentsStorage.gherkinDocuments,
          event,
        );
        feature.description = featureDocument.description || featureUri;
        const { name } = featureDocument;
        feature.name = name;
        feature.itemAttributes = utils.createAttributes(featureDocument.tags);
      }
    }

    onTestCasePrepared(event) {
      const featureUri = utils.getUri(event.sourceLocation.uri);
      const feature = this.documentsStorage.featureData[featureUri];
      // If this is the first scenario in the feature, start the feature in RP
      if (!feature.featureId) {
        feature.featureId = this.reportportal.startTestItem(
          {
            name: feature.name,
            startTime: this.reportportal.helpers.now(),
            type: isScenarioBasedStatistics ? 'TEST' : 'SUITE',
            codeRef: utils.formatCodeRef(featureUri, feature.name),
            description: feature.description,
            attributes: feature.itemAttributes,
          },
          this.context.launchId,
        ).tempId;
      }
      // If this is the first feature in the run, set the currentFeatureUri
      if (!this.context.currentFeatureUri) {
        this.context.currentFeatureUri = featureUri;
      }
      // If this is a new feature, finish the previous feature in RP.
      // does not work for the final feature in the run. that is finished in onTestRunFinished
      if (this.context.currentFeatureUri !== featureUri) {
        const previousFeature = this.documentsStorage.featureData[this.context.currentFeatureUri];
        // If this is a new feature, finish the previous feature
        reportportal.finishTestItem(previousFeature.featureId, {
          status: previousFeature.featureStatus,
          endTime: reportportal.helpers.now(),
        });
        // Now that the previous feature is finished, assign the new current feature
        this.context.currentFeatureUri = featureUri;
      }
      this.context.stepDefinitions = event;
      let hookType = 'Before';
      this.context.stepDefinitions.steps.forEach((step) => {
        if (step.sourceLocation) {
          hookType = 'After';
          return;
        }
        // eslint-disable-next-line no-param-reassign
        step.hookType = hookType;
      });
    }

    onTestCaseStarted(event) {
      const featureDocument = itemFinders.findFeature(
        this.documentsStorage.gherkinDocuments,
        event.sourceLocation,
      );
      this.context.scenario = itemFinders.findScenario(
        this.documentsStorage.gherkinDocuments,
        event.sourceLocation,
      );
      this.context.scenarioStatus = STATUSES.STARTED;
      this.context.background = itemFinders.findBackground(featureDocument);
      const featureTags = featureDocument.tags;
      const keyword = this.context.scenario.keyword
        ? this.context.scenario.keyword
        : this.context.scenario.type;
      let name = [keyword, this.context.scenario.name].join(': ');
      const eventTags = this.context.scenario.tags
        ? this.context.scenario.tags.filter(
            (tag) => !featureTags.find(utils.createTagComparator(tag)),
          )
        : [];
      const itemAttributes = utils.createAttributes(eventTags);
      const description =
        this.context.scenario.description ||
        [utils.getUri(event.sourceLocation.uri), event.sourceLocation.line].join(':');
      const { featureId } = this.documentsStorage.featureData[event.sourceLocation.uri];

      if (this.context.lastScenarioDescription !== name) {
        this.context.lastScenarioDescription = name;
        this.context.outlineRow = 0;
      } else if (event.attemptNumber < 2) {
        this.context.outlineRow += 1;
        name += ` [${this.context.outlineRow}]`;
      }

      // BeforeScenario
      if (isScenarioBasedStatistics || event.attemptNumber < 2) {
        this.context.scenarioId = this.reportportal.startTestItem(
          {
            name,
            startTime: this.reportportal.helpers.now(),
            type: isScenarioBasedStatistics ? 'STEP' : 'TEST',
            description,
            codeRef: utils.formatCodeRef(event.sourceLocation.uri, name),
            parameters: this.context.scenario.parameters,
            attributes: itemAttributes,
            retry: isScenarioBasedStatistics && event.attemptNumber > 1,
          },
          this.context.launchId,
          featureId,
        ).tempId;
      }
    }

    onTestStepStarted(event) {
      this.context.stepStatus = STATUSES.FAILED;
      this.context.stepId = null;

      this.context.stepSourceLocation = this.context.stepDefinitions.steps[event.index];

      // skip After Hook added by protractor-cucumber-framework
      if (
        !this.context.stepSourceLocation.sourceLocation &&
        this.context.stepSourceLocation.actionLocation.uri.includes(AFTER_HOOK_URI_TO_SKIP)
      )
        return;

      this.context.step = this.context.findStep(event);
      this.context.stepDefinition = itemFinders.findStepDefinition(this.context, event);

      let description;
      let name = this.context.step.text
        ? `${this.context.step.keyword} ${this.context.step.text}`
        : this.context.step.keyword;

      if (this.context.step.argument) {
        let stepArguments;
        if (this.context.step.argument.content) {
          stepArguments = `"""\n${this.context.step.argument.content}\n"""`;
        }

        if (this.context.step.argument.rows) {
          const rows = this.context.step.argument.rows.map((row) =>
            row.cells.map((cell) => {
              // Added an if statement to only replace step parameters if this is a Scenario Outline
              let tempStepValue = cell.value;
              if (this.context.scenario.parameters) {
                this.context.scenario.parameters.forEach((parameter) => {
                  if (cell.value.includes(`<${parameter.key}>`)) {
                    tempStepValue = utils.replaceParameter(
                      cell.value,
                      parameter.key,
                      parameter.value,
                    );
                  }
                });
              }
              return tempStepValue;
            }),
          );
          const datatable = new Table(TABLE_CONFIG);
          datatable.push(...rows);
          stepArguments = datatable.toString();
        }
        if (isScenarioBasedStatistics) {
          name += `\n${stepArguments}`;
        } else {
          description = stepArguments;
        }
      }

      let type = 'STEP';
      let isHook = false;
      if (this.context.step.keyword === 'Before') {
        type = 'BEFORE_TEST';
        isHook = true;
      } else if (this.context.step.keyword === 'After') {
        type = 'AFTER_TEST';
        isHook = true;
      }

      // hooks are described in cucumber's library core
      const codeRef =
        this.context.stepDefinition && !isHook
          ? utils.formatCodeRef(this.context.stepDefinition.uri, name)
          : undefined;

      this.context.stepId = this.reportportal.startTestItem(
        {
          name,
          description,
          startTime: this.reportportal.helpers.now(),
          type,
          codeRef,
          parameters: this.context.step.parameters,
          hasStats: !isScenarioBasedStatistics,
          retry: !isScenarioBasedStatistics && event.testCase.attemptNumber > 1,
        },
        this.context.launchId,
        this.context.scenarioId,
      ).tempId;
    }

    onTestStepFinished(event) {
      // skip After Hook added by protractor-cucumber-framework
      if (
        !this.context.stepSourceLocation.sourceLocation &&
        this.context.stepSourceLocation.actionLocation.uri.includes(AFTER_HOOK_URI_TO_SKIP)
      )
        return;

      // StepResult
      const sceenshotName = this.context.getFileName();

      switch (event.result.status) {
        case STATUSES.PASSED: {
          this.context.stepStatus = STATUSES.PASSED;
          if (this.context.scenarioStatus !== STATUSES.FAILED) {
            this.context.scenarioStatus = STATUSES.PASSED;
          }
          break;
        }
        case STATUSES.PENDING: {
          this.reportportal.sendLog(this.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'WARN',
            message: "This step is marked as 'pending'",
          });
          this.context.stepStatus = STATUSES.NOT_IMPLEMENTED;
          this.context.scenarioStatus = STATUSES.FAILED;
          this.context.incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.UNDEFINED: {
          this.reportportal.sendLog(this.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            message: 'There is no step definition found. Please verify and implement it.',
          });
          this.context.stepStatus = STATUSES.NOT_FOUND;
          this.context.scenarioStatus = STATUSES.FAILED;
          this.context.incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.AMBIGUOUS: {
          this.reportportal.sendLog(this.context.stepId, {
            time: this.reportportal.helpers.now(),
            level: 'ERROR',
            message:
              'There are more than one step implementation. Please verify and reimplement it.',
          });
          this.context.stepStatus = STATUSES.NOT_FOUND;
          this.context.scenarioStatus = STATUSES.FAILED;
          this.context.incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case STATUSES.SKIPPED: {
          this.context.stepStatus = STATUSES.SKIPPED;
          if (this.context.scenarioStatus === STATUSES.FAILED) {
            this.context.scenarioStatus = STATUSES.SKIPPED;
          }

          if (
            this.context.scenarioStatus === STATUSES.STARTED ||
            this.context.scenarioStatus === STATUSES.PASSED
          ) {
            this.context.scenarioStatus = STATUSES.SKIPPED;
          } else {
            this.context.scenarioStatus = STATUSES.FAILED;
            if (
              // eslint-disable-next-line no-prototype-builtins
              config.hasOwnProperty('reportSkippedCucumberStepsOnFailedTest') &&
              !config.reportSkippedCucumberStepsOnFailedTest
            ) {
              this.context.stepStatus = STATUSES.CANCELLED;
            }
          }

          break;
        }
        case STATUSES.FAILED: {
          this.context.stepStatus = STATUSES.FAILED;
          this.context.scenarioStatus = STATUSES.FAILED;
          this.context.incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          const errorMessage = `${
            this.context.stepDefinition.uri
          }\n ${event.result.exception.toString()}`;
          this.reportportal.sendLog(this.context.stepId, {
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
              this.reportportal.sendLog(this.context.stepId, request, fileObj);
            });
          }
          break;
        }
        default:
          break;
      }

      const itemParams = this.context.itemsParams[this.context.stepId];

      // AfterStep
      const request = {
        status: this.context.stepStatus,
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

      this.reportportal.finishTestItem(this.context.stepId, request);
    }

    updateItemParams(id, newParams) {
      this.context.itemsParams[id] = {
        ...this.context.itemsParams[id],
        ...newParams,
      };
    }

    getItemParams(id) {
      return this.context.itemsParams[id] || {};
    }

    onTestStepAttachment(event) {
      const fileName = this.context.getFileName();
      if (
        event.data &&
        event.data.length &&
        (this.context.stepStatus === STATUSES.PASSED || this.context.stepStatus === STATUSES.FAILED)
      ) {
        const dataObj = utils.getJSON(event.data);
        let itemId = this.context.stepId;

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
              this.context.launchStatus = dataObj.status;
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
                itemId = this.context.launchId;
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
                this.context.stepStatus === STATUSES.PASSED ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR,
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
                itemId = this.context.launchId;
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
      if (!isScenarioBasedStatistics && event.result.retried) {
        return;
      }
      const isFailed = event.result.status !== STATUSES.PASSED;
      // ScenarioResult
      this.reportportal.finishTestItem(this.context.scenarioId, {
        status: isFailed ? STATUSES.FAILED : STATUSES.PASSED,
        endTime: this.reportportal.helpers.now(),
      });
      this.context.scenarioId = null;
      const featureUri = event.sourceLocation.uri;

      this.documentsStorage.featureData[featureUri].featureStatus =
        this.context.failedScenarios[featureUri] > 0 ? STATUSES.FAILED : STATUSES.PASSED;
    }

    onTestRunFinished(event) {
      // Finish the final feature in the run
      const finalFeature = this.documentsStorage.featureData[this.context.currentFeatureUri];
      reportportal.finishTestItem(finalFeature.featureId, {
        status: finalFeature.featureStatus,
        endTime: reportportal.helpers.now(),
      });
      // AfterFeatures
      const promise = this.reportportal.getPromiseFinishAllItems(this.context.launchId);
      return promise.then(() => {
        if (this.context.launchId) {
          const finishLaunchRQ = {
            endTime: this.reportportal.helpers.now(),
            status: event.result.status ? STATUSES.PASSED : STATUSES.FAILED,
          };

          if (this.context.launchStatus) {
            finishLaunchRQ.status = this.context.launchStatus;
          }

          const launchFinishPromise = this.reportportal.finishLaunch(
            this.context.launchId,
            finishLaunchRQ,
          ).promise;
          launchFinishPromise.then(() => {
            this.context.resetContext();
          });
          this.reportportal.mergeLaunches();
        }
      });
    }
  };
};

module.exports = { createRPFormatterClass };
