const { Formatter } = require('cucumber');
const ReportPortalClient = require('reportportal-client');
const {
  cleanContext,
  createAttribute,
  createTagComparator,
  getJSON,
  getUri,
  isScenarioBasedStatistics,
} = require('./utils');
const Context = require('./context');
const { findFeature, findScenario, findBackground, findStepDefinition } = require('./itemFinders');
const pjson = require('../package.json');

const formatCodeRef = (path, itemName) => {
  const codeRef = path.replace(/\\/g, '/');

  return itemName ? `${codeRef}/${itemName}` : codeRef;
};

const getParameters = (header, body) => {
  const keys = header ? header.cells.map((cell) => cell.value) : [];

  if (Array.isArray(body)) {
    return body.reduce((acc, item) => {
      const params = item.cells.map((cell, index) => ({
        key: keys[index],
        value: cell.value,
      }));

      return acc.concat(params);
    }, []);
  }

  return body.cells.map((cell, index) => ({
    key: keys[index],
    value: cell.value,
  }));
};

const createRPFormatterClass = (config) => {
  const gherkinDocuments = {};
  const pickleDocuments = {};
  const reportportal = new ReportPortalClient(config, { name: pjson.name, version: pjson.version });
  const attributesConf = !config.attributes ? [] : config.attributes;
  const afterHookURIToSkip = 'protractor-cucumber-framework';

  function cacheDocument(gherkinDocument) {
    gherkinDocuments[gherkinDocument.uri] = gherkinDocument.document;
  }

  function cacheAcceptedPickle(event) {
    pickleDocuments[event.uri] = event.pickle;
  }

  function isAcceptedPickleCached(event) {
    return !!pickleDocuments[event.uri];
  }

  return class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);
      this.contextState = new Context();

      const { rerun, rerunOf } = options.parsedArgvOptions || {};

      this.isRerun = rerun || config.rerun;
      this.rerunOf = rerunOf || config.rerunOf;

      options.eventBroadcaster.on('gherkin-document', this.onGherkinDocument.bind(this));
      options.eventBroadcaster.on('pickle-accepted', this.onPickleAccepted.bind(this));
      options.eventBroadcaster.on('test-case-prepared', this.onTestCasePrepared.bind(this));
      options.eventBroadcaster.on('test-case-started', this.onTestCaseStarted.bind(this));
      options.eventBroadcaster.on('test-step-started', this.onTestStepStarted.bind(this));
      options.eventBroadcaster.on('test-step-finished', this.onTestStepFinished.bind(this));
      options.eventBroadcaster.on('test-step-attachment', this.onTestStepAttachment.bind(this));
      options.eventBroadcaster.on('test-case-finished', this.onTestCaseFinished.bind(this));
      options.eventBroadcaster.on('test-run-finished', this.onTestRunFinished.bind(this));
    }

    onGherkinDocument(event) {
      cacheDocument(event);

      // BeforeFeatures
      if (!this.contextState.context.launchId) {
        const launch = reportportal.startLaunch({
          name: config.launch,
          startTime: reportportal.helpers.now(),
          description: !config.description ? '' : config.description,
          attributes: [
            ...attributesConf,
            { key: 'agent', value: `${pjson.name}|${pjson.version}`, system: true },
          ],
          rerun: this.isRerun,
          rerunOf: this.rerunOf,
        });
        this.contextState.context.launchId = launch.tempId;
      }
    }

    onPickleAccepted(event) {
      if (!isAcceptedPickleCached(event)) {
        cacheAcceptedPickle(event);

        const featureDocument = findFeature(gherkinDocuments, event);
        const featureUri = getUri(event.uri);
        const description = featureDocument.description ? featureDocument.description : featureUri;
        const { name } = featureDocument;
        const eventAttributes = featureDocument.tags
          ? featureDocument.tags.map((tag) => createAttribute(tag.name))
          : [];

        let total = featureDocument.children.length;
        let parameters = [];
        featureDocument.children.forEach((child) => {
          if (child.examples) {
            child.examples.forEach((ex) => {
              total += ex.tableBody.length - 1;
              parameters = parameters.concat(getParameters(ex.tableHeader, ex.tableBody));
            });
          }
        });

        this.contextState.context.background = findBackground(featureDocument);
        if (this.contextState.context.background) {
          total -= 1;
        }

        this.contextState.context.scenariosCount[featureUri] = { total, done: 0 };

        // BeforeFeature
        const featureId = reportportal.startTestItem(
          {
            name,
            startTime: reportportal.helpers.now(),
            type: isScenarioBasedStatistics() ? 'TEST' : 'SUITE',
            codeRef: formatCodeRef(event.uri, name),
            parameters,
            description,
            attributes: eventAttributes,
          },
          this.contextState.context.launchId,
        ).tempId;

        pickleDocuments[event.uri].featureId = featureId;
      }
    }

    onTestCasePrepared(event) {
      this.contextState.context.stepDefinitions = event;
      this.contextState.context.isBeforeHook = true;
    }

    onTestCaseStarted(event) {
      const featureDocument = findFeature(gherkinDocuments, event.sourceLocation);
      this.contextState.context.scenario = findScenario(gherkinDocuments, event.sourceLocation);
      this.contextState.context.background = findBackground(featureDocument);
      const featureTags = featureDocument.tags;
      const pickle = pickleDocuments[getUri(event.sourceLocation.uri)];
      const keyword = this.contextState.context.scenario.keyword
        ? this.contextState.context.scenario.keyword
        : this.contextState.context.scenario.type;
      let name = [keyword, this.contextState.context.scenario.name].join(': ');
      const eventAttributes = pickle.tags
        ? pickle.tags
            .filter((tag) => !featureTags.find(createTagComparator(tag)))
            .map((tag) => createAttribute(tag.name))
        : [];
      const description =
        this.contextState.context.scenario.description ||
        [getUri(event.sourceLocation.uri), event.sourceLocation.line].join(':');
      const { featureId } = pickleDocuments[event.sourceLocation.uri];

      if (this.contextState.context.lastScenarioDescription !== name) {
        this.contextState.context.lastScenarioDescription = name;
        this.contextState.context.outlineRow = 0;
      } else if (event.attemptNumber < 2) {
        this.contextState.context.outlineRow++;
        name += ` [${this.contextState.context.outlineRow}]`;
      }

      // BeforeScenario
      if (isScenarioBasedStatistics() || event.attemptNumber < 2) {
        this.contextState.context.scenarioId = reportportal.startTestItem(
          {
            name,
            startTime: reportportal.helpers.now(),
            type: isScenarioBasedStatistics() ? 'STEP' : 'TEST',
            description,
            codeRef: formatCodeRef(event.sourceLocation.uri, name),
            parameters: this.contextState.context.scenario.parameters,
            attributes: eventAttributes,
            retry: isScenarioBasedStatistics() && event.attemptNumber > 1,
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
        this.contextState.context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)
      )
        return;

      this.contextState.context.step = this.contextState.findStep(event);
      this.contextState.context.stepDefinition = findStepDefinition(event);

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
          ? formatCodeRef(this.contextState.context.stepDefinition.uri, name)
          : undefined;

      this.contextState.context.stepId = reportportal.startTestItem(
        {
          name,
          startTime: reportportal.helpers.now(),
          type,
          codeRef,
          parameters: this.contextState.context.step.parameters,
          hasStats: !isScenarioBasedStatistics(),
          retry: !isScenarioBasedStatistics() && event.testCase.attemptNumber > 1,
        },
        this.contextState.context.launchId,
        this.contextState.context.scenarioId,
      ).tempId;
    }

    onTestStepFinished(event) {
      // skip After Hook added by protractor-cucumber-framework
      if (
        !this.contextState.context.stepSourceLocation.sourceLocation &&
        this.contextState.context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)
      )
        return;

      // StepResult
      const sceenshotName = !this.contextState.context.stepDefinition
        ? 'UNDEFINED STEP'
        : `Failed at step definition line:${this.contextState.context.stepDefinition.line}`;

      switch (event.result.status) {
        case 'passed': {
          this.contextState.context.stepStatus = 'passed';
          this.contextState.context.scenarioStatus = 'passed';
          break;
        }
        case 'pending': {
          reportportal.sendLog(this.contextState.context.stepId, {
            time: reportportal.helpers.now(),
            level: 'WARN',
            message: "This step is marked as 'pending'",
          });
          this.contextState.context.stepStatus = 'not_implemented';
          this.contextState.context.scenarioStatus = 'failed';
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'undefined': {
          reportportal.sendLog(this.contextState.context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message: 'There is no step definition found. Please verify and implement it.',
          });
          this.contextState.context.stepStatus = 'not_found';
          this.contextState.context.scenarioStatus = 'failed';
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'ambiguous': {
          reportportal.sendLog(this.contextState.context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message:
              'There are more than one step implementation. Please verify and reimplement it.',
          });
          this.contextState.context.stepStatus = 'not_found';
          this.contextState.context.scenarioStatus = 'failed';
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'skipped': {
          this.contextState.context.stepStatus = 'skipped';
          if (this.contextState.context.scenarioStatus === 'failed') {
            this.contextState.context.scenarioStatus = 'skipped';
          }
          break;
        }
        case 'failed': {
          this.contextState.context.stepStatus = 'failed';
          this.contextState.countFailedScenarios(event.testCase.sourceLocation.uri);
          const errorMessage = `${
            this.contextState.context.stepDefinition.uri
          }\n ${event.result.exception.toString()}`;
          reportportal.sendLog(this.contextState.context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message: errorMessage,
          });
          if (global.browser && config.takeScreenshot && config.takeScreenshot === 'onFailure') {
            const request = {
              time: reportportal.helpers.now(),
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
              reportportal.sendLog(this.contextState.context.stepId, request, fileObj);
            });
          }
          break;
        }
        default:
          break;
      }

      // AfterStep
      const request = {
        status: this.contextState.context.stepStatus,
        endTime: reportportal.helpers.now(),
      };
      if (request.status === 'not_found') {
        request.status = 'failed';
        request.issue = {
          issueType: 'ab001',
          comment: 'STEP DEFINITION WAS NOT FOUND',
        };
      } else if (request.status === 'not_implemented') {
        request.status = 'skipped';
        request.issue = {
          issueType: 'ti001',
          comment: 'STEP IS PENDING IMPLEMENTATION',
        };
      }

      reportportal.finishTestItem(this.contextState.context.stepId, request);
    }

    onTestStepAttachment(event) {
      const fileName = !this.contextState.context.stepDefinition
        ? 'UNDEFINED STEP'
        : `Attachment at step definition line:${this.contextState.context.stepDefinition.line}`;
      if (
        event.data &&
        event.data.length &&
        (this.contextState.context.stepStatus === 'passed' || this.contextState.context.stepStatus === 'failed')
      ) {
        switch (event.media.type) {
          case 'text/plain': {
            const logMessage = getJSON(event.data);
            const request = {
              time: reportportal.helpers.now(),
            };
            if (logMessage) {
              request.level = logMessage.level;
              request.message = logMessage.message;
            } else {
              request.level = 'DEBUG';
              request.message = event.data;
            }
            reportportal.sendLog(this.contextState.context.stepId, request);
            break;
          }
          default: {
            const request = {
              time: reportportal.helpers.now(),
              level: this.contextState.context.stepStatus === 'passed' ? 'DEBUG' : 'ERROR',
              message: fileName,
              file: {
                name: fileName,
              },
            };
            const parsedObject = getJSON(event.data);
            if (parsedObject) {
              request.level = parsedObject.level;
              request.message = parsedObject.message;
              request.file.name = parsedObject.message;
            }
            const fileObj = {
              name: fileName,
              type: event.media.type,
              content: (parsedObject && parsedObject.data) || event.data,
            };
            reportportal.sendLog(this.contextState.context.stepId, request, fileObj);
            break;
          }
        }
      }
    }

    onTestCaseFinished(event) {
      if (!isScenarioBasedStatistics() && event.result.retried) {
        return;
      }
      const isFailed = event.result.status.toUpperCase() !== 'PASSED';
      // ScenarioResult
      reportportal.finishTestItem(this.contextState.context.scenarioId, {
        status: isFailed ? 'failed' : 'passed',
        endTime: reportportal.helpers.now(),
      });
      this.contextState.context.scenarioStatus = 'failed';
      this.contextState.context.scenarioId = null;

      const featureUri = event.sourceLocation.uri;
      if (!event.result.retried) {
        this.contextState.context.scenariosCount[featureUri].done++;
      }
      const { total, done } = this.contextState.context.scenariosCount[featureUri];
      if (done === total) {
        const featureStatus = this.contextState.context.failedScenarios[featureUri] > 0 ? 'failed' : 'passed';
        reportportal.finishTestItem(pickleDocuments[featureUri].featureId, {
          status: featureStatus,
          endTime: reportportal.helpers.now(),
        });
      }
    }

    onTestRunFinished() {
      // AfterFeatures
      const promise = reportportal.getPromiseFinishAllItems(this.contextState.context.launchId);
      promise.then(() => {
        if (this.contextState.context.launchId) {
          const launchFinishPromise = reportportal.finishLaunch(
            this.contextState.context.launchId,
            {
              endTime: reportportal.helpers.now(),
            },
          ).promise;
          launchFinishPromise.then(() => {
            this.contextState.context = cleanContext();
          });
        }
      });
    }
  };
};

module.exports = { createRPFormatterClass };
