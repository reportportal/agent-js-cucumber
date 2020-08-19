const {Formatter} = require('cucumber');
const ReportPortalClient = require('@reportportal/client-javascript');
const path = require('path');
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
  const getJSON = (json) => {
    try {
      const jsonObject = JSON.parse(json);
      if (jsonObject && typeof jsonObject === 'object') {
        return jsonObject;
      }
    } catch (error) {
      // eslint-disable-line no-empty
    }
    return false;
  };

  const getUri = (uri) => uri.replace(process.cwd() + path.sep, '');

  const cleanContext = () => ({
    outlineRow: 0,
    scenarioStatus: 'failed',
    forcedIssue: null,
    featureId: null,
    scenarioId: null,
    stepId: null,
    stepStatus: 'failed',
    launchId: null,
    background: null,
    failedScenarios: {},
    lastScenarioDescription: null,
    scenario: null,
    step: null,
    stepSourceLocation: null,
    stepDefinitions: null,
    stepDefinition: null,
    isBeforeHook: true,
  });

  const createAttribute = (tag = '') => {
    const parsedTag = tag.replace('@', '').split(':');
    let attribute = null;
    if (parsedTag.length > 1) {
      attribute = {
        key: parsedTag[0],
        value: parsedTag[1],
      };
    } else {
      attribute = {
        value: parsedTag[0],
      };
    }
    return attribute;
  };

  const createTagComparator = (tagA) => (tagB) =>
    tagB.name === tagA.name &&
    tagB.location.line === tagA.location.line &&
    tagB.location.column === tagA.location.column;

  const isScenarioBasedStatistics = typeof config.scenarioBasedStatistics === 'boolean' ? config.scenarioBasedStatistics : false;

  const gherkinDocuments = {};
  const featureData = {};
  const reportportal = new ReportPortalClient(config, {name: pjson.name, version: pjson.version});
  let context = cleanContext();
  const attributesConf = !config.attributes ? [] : config.attributes;
  const afterHookURIToSkip = 'protractor-cucumber-framework';

  function cacheDocument(gherkinDocument) {
    gherkinDocuments[gherkinDocument.uri] = gherkinDocument.document;
  }

  function createCachedFeature(uri) {
    featureData[uri] = {};
  }

  function isFeatureDataCached(uri) {
    return !!featureData[uri];
  }

  function createSteps(header, row, steps) {
    return steps.map((step) => {
      const modified = {...step, parameters: []};

      header.cells.forEach((variable, index) => {
        const isParameterPresents = modified.text.indexOf(`<${variable.value}>`) !== -1;
        modified.text = replaceParameter(modified.text, variable.value, row.cells[index].value);

        if (isParameterPresents) {
          modified.parameters.push({key: variable.value, value: row.cells[index].value});
        }
      });

      return modified;
    });
  }

  function replaceParameter(originalString, name, value) {
    return originalString.replace(`<${name}>`, value);
  }

  function createScenarioFromOutlineExample(outline, example, row) {
    const parameters = getParameters(example.tableHeader, row);
    let outlineName = outline.name;


    parameters.forEach(param => outlineName = replaceParameter(outlineName, param.key, param.value));

    return {
      type: 'Scenario',
      tags: example.tags,
      location: row.location,
      keyword: 'Scenario',
      name: outlineName,
      steps: createSteps(example.tableHeader, row, outline.steps),
      parameters,
      description: outline.description,
    };
  }

  function createScenarioFromOutline(outline, location) {
    let foundRow;
    const foundExample = outline.examples.find((example) => {
      foundRow = example.tableBody.find((row) => row.location.line === location.line);

      return !!foundRow;
    });

    if (!foundRow) return null;

    return createScenarioFromOutlineExample(outline, foundExample, foundRow);
  }

  function findOutlineScenario(outlines, location) {
    return outlines
      .map((child) => createScenarioFromOutline(child, location))
      .find((outline) => !!outline);
  }

  function findFeature(location) {
    return gherkinDocuments[location.uri].feature;
  }

  function findScenario(location) {
    const {children} = findFeature(location);
    const scenario = children.find(
      (child) => child.type === 'Scenario' && child.location.line === location.line,
    );
    if (scenario) {
      return scenario;
    }

    const outlines = children.filter((child) => child.type === 'ScenarioOutline');
    return findOutlineScenario(outlines, location);
  }

  function findBackground(feature) {
    const background = feature.children
      ? feature.children.find((child) => child.type === 'Background')
      : null;

    return background;
  }

  function findStep(event) {
    let stepObj = null;
    const stepSourceLocation = context.stepDefinitions.steps[event.index];

    if (stepSourceLocation.sourceLocation) {
      context.isBeforeHook = false;
      context.scenario.steps.forEach((step) => {
        if (
          stepSourceLocation.sourceLocation.uri === event.testCase.sourceLocation.uri &&
          stepSourceLocation.sourceLocation.line === step.location.line
        ) {
          stepObj = step;
        }
      });

      if (context.background) {
        context.background.steps.forEach((step) => {
          if (
            stepSourceLocation.sourceLocation.uri === event.testCase.sourceLocation.uri &&
            stepSourceLocation.sourceLocation.line === step.location.line
          ) {
            stepObj = step;
          }
        });
      }
    } else {
      stepObj = {keyword: context.isBeforeHook ? 'Before' : 'After'};
    }
    return stepObj;
  }

  function findStepDefinition(event) {
    return context.stepDefinitions.steps[event.index].actionLocation;
  }

  function incrementFailedScenariosCount(uri) {
    context.failedScenarios[uri] = context.failedScenarios[uri] ? context.failedScenarios[uri] + 1 : 1;
  }

  return class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);

      const {rerun, rerunOf} = options.parsedArgvOptions || {};

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
      if (!context.launchId) {
        const launch = reportportal.startLaunch({
          name: config.launch,
          startTime: reportportal.helpers.now(),
          description: !config.description ? '' : config.description,
          attributes: [
            ...attributesConf,
            {key: 'agent', value: `${pjson.name}|${pjson.version}`, system: true},
          ],
          rerun: this.isRerun,
          rerunOf: this.rerunOf,
        });
        context.launchId = launch.tempId;
      }
    }

    onPickleAccepted(event) {
      const featureUri = getUri(event.uri);
      if (!isFeatureDataCached(featureUri)) {
        createCachedFeature(featureUri);

        const featureDocument = findFeature(event);
        const description = featureDocument.description ? featureDocument.description : featureUri;
        const {name} = featureDocument;
        const eventAttributes = featureDocument.tags
          ? featureDocument.tags.map((tag) => createAttribute(tag.name))
          : [];

        let parameters = [];

        // BeforeFeature
        const featureId = reportportal.startTestItem(
          {
            name,
            startTime: reportportal.helpers.now(),
            type: isScenarioBasedStatistics ? 'TEST' : 'SUITE',
            codeRef: formatCodeRef(event.uri, name),
            parameters,
            description,
            attributes: eventAttributes,
          },
          context.launchId,
        ).tempId;

        featureData[getUri(event.uri)].featureId = featureId;
      }
    }

    onTestCasePrepared(event) {
      context.stepDefinitions = event;
      context.isBeforeHook = true;
    }

    onTestCaseStarted(event) {
      const featureDocument = findFeature(event.sourceLocation);
      context.background = findBackground(featureDocument);
      context.scenario = findScenario(event.sourceLocation);
      context.scenarioStatus = 'started';
      const featureTags = featureDocument.tags;
      const keyword = context.scenario.keyword ? context.scenario.keyword : context.scenario.type;
      let name = [keyword, context.scenario.name].join(': ');
      const eventAttributes = context.scenario.tags
        ? context.scenario.tags
          .filter((tag) => !featureTags.find(createTagComparator(tag)))
          .map((tag) => createAttribute(tag.name))
        : [];
      const description =
        context.scenario.description ||
        [getUri(event.sourceLocation.uri), event.sourceLocation.line].join(':');
      const {featureId} = featureData[event.sourceLocation.uri];

      if (context.lastScenarioDescription !== name) {
        context.lastScenarioDescription = name;
        context.outlineRow = 0;
      } else if (event.attemptNumber < 2) {
        context.outlineRow++;
        name += ` [${context.outlineRow}]`;
      }

      // BeforeScenario
      if (isScenarioBasedStatistics || event.attemptNumber < 2) {
        context.scenarioId = reportportal.startTestItem(
          {
            name,
            startTime: reportportal.helpers.now(),
            type: isScenarioBasedStatistics ? 'STEP' : 'TEST',
            description,
            codeRef: formatCodeRef(event.sourceLocation.uri, name),
            parameters: context.scenario.parameters,
            attributes: eventAttributes,
            retry: isScenarioBasedStatistics && event.attemptNumber > 1,
          },
          context.launchId,
          featureId,
        ).tempId;
      }
    }

    onTestStepStarted(event) {
      context.stepStatus = 'failed';
      context.stepId = null;

      context.stepSourceLocation = context.stepDefinitions.steps[event.index];

      // skip After Hook added by protractor-cucumber-framework
      if (
        !context.stepSourceLocation.sourceLocation &&
        context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)
      )
        return;

      context.step = findStep(event);
      context.stepDefinition = findStepDefinition(event);

      const name = context.step.text
        ? `${context.step.keyword} ${context.step.text}`
        : context.step.keyword;
      let type = 'STEP';
      let isHook = false;
      if (context.step.keyword === 'Before') {
        type = 'BEFORE_TEST';
        isHook = true;
      } else if (context.step.keyword === 'After') {
        type = 'AFTER_TEST';
        isHook = true;
      }

      // hooks are described in cucumber's library core
      const codeRef =
        context.stepDefinition && !isHook
          ? formatCodeRef(context.stepDefinition.uri, name)
          : undefined;

      context.stepId = reportportal.startTestItem(
        {
          name,
          startTime: reportportal.helpers.now(),
          type,
          codeRef,
          parameters: context.step.parameters,
          hasStats: !isScenarioBasedStatistics,
          retry: !isScenarioBasedStatistics && event.testCase.attemptNumber > 1,
        },
        context.launchId,
        context.scenarioId,
      ).tempId;
    }

    onTestStepFinished(event) {
      // skip After Hook added by protractor-cucumber-framework
      if (
        !context.stepSourceLocation.sourceLocation &&
        context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)
      )
        return;

      // StepResult
      const sceenshotName = !context.stepDefinition
        ? 'UNDEFINED STEP'
        : `Failed at step definition line:${context.stepDefinition.line}`;

      switch (event.result.status) {
        case 'passed': {
          context.stepStatus = 'passed';
          if (context.scenarioStatus !== 'failed') {
            context.scenarioStatus = 'passed';
          }
          break;
        }
        case 'pending': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: 'WARN',
            message: "This step is marked as 'pending'",
          });
          context.stepStatus = 'not_implemented';
          context.scenarioStatus = 'failed';
          incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case 'undefined': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message: 'There is no step definition found. Please verify and implement it.',
          });
          context.stepStatus = 'not_found';
          context.scenarioStatus = 'failed';
          incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case 'ambiguous': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message:
              'There are more than one step implementation. Please verify and reimplement it.',
          });
          context.stepStatus = 'not_found';
          context.scenarioStatus = 'failed';
          incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          break;
        }
        case 'skipped': {
          context.stepStatus = 'skipped';
          if (context.scenarioStatus === 'started' || context.scenarioStatus === 'passed') {
            context.scenarioStatus = 'skipped';
          } else {
            context.scenarioStatus = 'failed';
            if (config.hasOwnProperty('reportSkippedCucumberStepsOnFailedTest') && !config.reportSkippedCucumberStepsOnFailedTest) {
              context.stepStatus = 'cancelled';
            }
          }
          break;
        }
        case 'failed': {
          context.stepStatus = 'failed';
          context.scenarioStatus = 'failed';
          incrementFailedScenariosCount(event.testCase.sourceLocation.uri);
          const errorMessage = `${
            context.stepDefinition.uri
          }\n ${event.result.exception.toString()}`;
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: 'ERROR',
            message: errorMessage,
          });
          if (global.browser && config.takeScreenshot && config.takeScreenshot === 'onFailure') {
            const request = {
              time: reportportal.helpers.now(),
              level: 'ERROR',
              file: {name: sceenshotName},
              message: sceenshotName,
            };
            global.browser.takeScreenshot().then((png) => {
              const fileObj = {
                name: sceenshotName,
                type: 'image/png',
                content: png,
              };
              reportportal.sendLog(context.stepId, request, fileObj);
            });
          }
          break;
        }
        default:
          break;
      }

      // AfterStep
      const request = {
        status: context.stepStatus,
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

      reportportal.finishTestItem(context.stepId, request);
    }

    onTestStepAttachment(event) {
      const fileName = !context.stepDefinition
        ? 'UNDEFINED STEP'
        : `Attachment at step definition line:${context.stepDefinition.line}`;
      if (
        event.data &&
        event.data.length &&
        (context.stepStatus === 'passed' || context.stepStatus === 'failed')
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
            reportportal.sendLog(context.stepId, request);
            break;
          }
          default: {
            const request = {
              time: reportportal.helpers.now(),
              level: context.stepStatus === 'passed' ? 'DEBUG' : 'ERROR',
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
            reportportal.sendLog(context.stepId, request, fileObj);
            break;
          }
        }
      }
    }

    onTestCaseFinished(event) {
      const isFailed = event.result.status.toUpperCase() !== 'PASSED';
      // ScenarioResult
      reportportal.finishTestItem(context.scenarioId, {
        status: isFailed ? 'failed' : 'passed',
        endTime: reportportal.helpers.now(),
      });
      context.scenarioId = null;

      const featureUri = event.sourceLocation.uri;
      featureData[featureUri].featureStatus = context.failedScenarios[featureUri] > 0 ? 'failed' : 'passed';
    }

    onTestRunFinished() {
      Object.keys(featureData).forEach(feature => {
        reportportal.finishTestItem(featureData[feature].featureId, {
          status: featureData[feature].featureStatus,
          endTime: reportportal.helpers.now(),
        });
      });
      // AfterFeatures
      const promise = reportportal.getPromiseFinishAllItems(context.launchId);
      promise.then(() => {
        if (context.launchId) {
          const launchFinishPromise = reportportal.finishLaunch(context.launchId, {
            endTime: reportportal.helpers.now(),
          }).promise;
          launchFinishPromise.then(() => {
            context = cleanContext();
          });
        }
      });
    }
  };
};

module.exports = {createRPFormatterClass};
