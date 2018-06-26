const ReportPortalClient = require('reportportal-client')
const Path = require('path')
const deasync = require('deasync');

const takeScreenshotSync = () => {
  let done = false;
  let image;
  browser.takeScreenshot().then(png => {
    done = true;
    image = png
  });
  deasync.loopWhile(function () {
    return !done;
  });
  return image;
};

const resolveReportPortalPromise = (promise) => {
  let asyncDone = false;
  promise.then(() => asyncDone = true, () => {
    asyncDone = true;
    console.log('Error occured on resolving Report Portal promise');
  });
  deasync.loopWhile(function () {return !asyncDone;});
};

module.exports = (config) => {

  getJSON = (json) => {
    try {
      let jsonObject = JSON.parse(json);
      if (jsonObject && typeof jsonObject === "object") {
        return jsonObject;
      }
    }
    catch (error) {
    }
    return false;
  };

  getUri = uri => uri.replace(process.cwd() + Path.sep, '');

  cleanContext = () => {
    return {
      outlineRow: 0,
      scenarioStatus: 'failed',
      forcedIssue: null,
      featureId: null,
      scenarioId: null,
      stepId: null,
      stepStatus: 'failed',
      launchId: null,
      failedScenarios: {},
      lastScenarioDescription: null,
      scenario: null,
      step: null,
      stepSourceLocation: null,
      stepDefinitions: null,
      stepDefinition: null,
      isBeforeHook: true
    };
  };

  let gherkinDocuments = {};
  let pickleDocuments = {};
  let reportportal = new ReportPortalClient(config);
  let context = cleanContext();
  let tagsConf = !config.tags ? [] : config.tags;
  let done = null;
  let afterHookURIToSkip = 'protractor-cucumber-framework';

  function cacheDocument(gherkinDocument) {
    gherkinDocuments[gherkinDocument.uri] = gherkinDocument.document;
  }

  function cacheAcceptedPickle(event) {
    pickleDocuments[event.uri] = event.pickle;
  }

  function isAcceptedPickleCached(event) {
    return !!pickleDocuments[event.uri];
  }

  function findFeature(location) {
    return gherkinDocuments[location.uri].feature;
  }

  function findScenario(location) {
    const children = findFeature(location).children;
    const scenario = children.find(
      child => child.type === 'Scenario' && child.location.line === location.line
    );
    if (scenario) {
      return scenario;
    }

    const outlines = children.filter(child => child.type === 'ScenarioOutline');
    return _findOutlineScenario(outlines, location);
  }

  function _findOutlineScenario(outlines, location) {
    return outlines
      .map(child => _createScenarioFromOutline(child, location))
      .find(outline => !!outline);
  }

  function _createScenarioFromOutline(outline, location) {
    const foundExample = outline.examples.find(example => {
      const foundRow = example.tableBody.find(
        row => row.location.line === location.line
      );

      return !!foundRow;
    });

    if (!foundExample) return null;

    return _createScenarioFromOutlineExample(outline, foundExample, location);
  }

  function _createScenarioFromOutlineExample(outline, example, location) {
    const found = example.tableBody.find(
      row => row.location.line === location.line
    );

    if (!found) return null;

    return {
      type: 'Scenario',
      steps: _createSteps(example.tableHeader, found, outline.steps),
      name: outline.name,
      location: found.location
    };
  }

  function _createSteps(header, row, steps) {
    return steps.map(step => {
      const modified = Object.assign({}, step);

      header.cells.forEach((varable, index) => {
        modified.text = modified.text.replace(
          '<' + varable.value + '>',
          row.cells[index].value
        );
      });

      return modified;
    });
  }

  function findStep(event) {
    let stepObj = null;
    let stepSourceLocation = context.stepDefinitions.steps[event.index];

    if (stepSourceLocation.sourceLocation) {
      context.isBeforeHook = false;
      context.scenario.steps.forEach((step) => {
        if (stepSourceLocation.sourceLocation.uri === event.testCase.sourceLocation.uri && stepSourceLocation.sourceLocation.line === step.location.line) {
          stepObj = step;
        }
      })
    } else {
      stepObj = {'keyword': context.isBeforeHook ? 'Before' : 'After'};
    }
    return stepObj;
  }

  function findStepDefinition(event) {
    return context.stepDefinitions.steps[event.index].actionLocation;
  }

  function countFailedScenarios(uri) {
    if (context.failedScenarios[uri]) {
      context.failedScenarios[uri]++
    } else {
      context.failedScenarios[uri] = 1;
    }
  }

  reportPortalHandlers = function () {

    this.eventBroadcaster.on('gherkin-document', (event) => {
      cacheDocument(event);

      //BeforeFeatures
      if (!context.launchId) {
        context.launchId = reportportal.startLaunch({
          name: config.launch,
          start_time: reportportal.helpers.now(),
          description: !config.description ? "" : config.description,
          tags: tagsConf
        }).tempId;
      }
    });

    this.eventBroadcaster.on('pickle-accepted', (event) => {
      if (!isAcceptedPickleCached(event)) {
        cacheAcceptedPickle(event);

        let featureDocument = findFeature(event);
        let description = featureDocument.description ? featureDocument.description : featureUri;
        let featureUri = getUri(event.uri);
        let name = featureDocument.name;
        let tagsEvent = featureDocument.tags ? featureDocument.tags.map(tag => tag.name) : [];

        //BeforeFeature
        let featureId = reportportal.startTestItem({
          name: name,
          start_time: reportportal.helpers.now(),
          type: "SUITE",
          description: description,
          tags: [...tagsConf, ...tagsEvent]
        }, context.launchId).tempId;

        pickleDocuments[event.uri].featureId = featureId;
      }
    });

    this.eventBroadcaster.on('test-case-prepared', (event) => {
      context.stepDefinitions = event;
      context.isBeforeHook = true;
    });

    this.eventBroadcaster.on('test-case-started', (event) => {
      context.scenario = findScenario(event.sourceLocation);
      let keyword = context.scenario.keyword ? context.scenario.keyword : context.scenario.type;
      let name = [keyword, context.scenario.name].join(': ');
      let tagsEvent = context.scenario.tags ? context.scenario.tags.map(tag => tag.name) : [];
      let description = [getUri(event.sourceLocation.uri), event.sourceLocation.line].join(':');
      let featureId = pickleDocuments[event.sourceLocation.uri].featureId;

      if (context.lastScenarioDescription !== name) {
        context.lastScenarioDescription = name;
        context.outlineRow = 0;
      } else {
        context.outlineRow++;
        name += ' [' + context.outlineRow + ']';
      }

      //BeforeScenario
      context.scenarioId = reportportal.startTestItem({
        name: name,
        start_time: reportportal.helpers.now(),
        type: "TEST",
        description: description,
        tags: [...tagsConf, ...tagsEvent]
      }, context.launchId, featureId).tempId;
    });

    this.eventBroadcaster.on('test-step-started', (event) => {
      context.stepStatus = 'failed';
      context.stepId = null;

      context.stepSourceLocation = context.stepDefinitions.steps[event.index];

      // skip After Hook added by protractor-cucumber-framework
      if (!context.stepSourceLocation.sourceLocation && context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)) return;

      context.step = findStep(event);
      context.stepDefinition = findStepDefinition(event);

      // BeforeStep
      let args = [];
      if (context.step.argument && context.step.argument.rows.length) {
        context.step.argument.rows.forEach((row) => {
          let line = row.cells.map(cell => cell.value);
          args.push(`|${line.join('|').trim()}|`)
        })
      }

      let name = context.step.text ? `${context.step.keyword} ${context.step.text}` : context.step.keyword;

      context.stepId = reportportal.startTestItem({
        name: name,
        start_time: reportportal.helpers.now(),
        type: "STEP",
        description: args.length ? args.join("\n").trim() : ""
      }, context.launchId, context.scenarioId).tempId;
    });

    this.eventBroadcaster.on('test-step-finished', (event) => {
      // skip After Hook added by protractor-cucumber-framework
      if (!context.stepSourceLocation.sourceLocation && context.stepSourceLocation.actionLocation.uri.includes(afterHookURIToSkip)) return;

      //StepResult
      let sceenshotName = !context.stepDefinition ? 'UNDEFINED STEP' : `Failed at step definition line:${context.stepDefinition.line}`;

      switch (event.result.status) {
        case 'passed': {
          context.stepStatus = 'passed';
          context.scenarioStatus = 'passed';
          break;
        }
        case 'pending': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: "WARN",
            message: "This step is marked as 'pending'"
          });
          context.stepStatus = 'not_implemented';
          context.scenarioStatus = 'failed';
          countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'undefined': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: "ERROR",
            message: "There is no step definition found. Please verify and implement it."
          });
          context.stepStatus = 'not_found';
          context.scenarioStatus = 'failed';
          countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'ambiguous': {
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: "ERROR",
            message: "There are more than one step implementation. Please verify and reimplement it."
          });
          context.stepStatus = 'not_found';
          context.scenarioStatus = 'failed';
          countFailedScenarios(event.testCase.sourceLocation.uri);
          break;
        }
        case 'skipped': {
          context.stepStatus = 'skipped';
          if (context.scenarioStatus === 'failed') {
            context.scenarioStatus = 'skipped';
          }
          break;
        }
        case 'failed': {
          context.stepStatus = 'failed';
          countFailedScenarios(event.testCase.sourceLocation.uri);
          let errorMessage = `${context.stepDefinition.uri}\n ${event.result.exception.toString()}`;
          reportportal.sendLog(context.stepId, {
            time: reportportal.helpers.now(),
            level: "ERROR",
            message: errorMessage
          });
          if ((typeof browser!== 'undefined') &&config.takeScreenshot && (config.takeScreenshot === 'onFailure')) {
            let request = {
              time: reportportal.helpers.now(),
              level: "ERROR",
              file: {name: sceenshotName},
              message: sceenshotName
            }
            const png = takeScreenshotSync();
            let fileObj = {
              name: sceenshotName,
              type: "image/png",
              content: png
            }
            reportportal.sendLog(context.stepId, request, fileObj)
          }
          break;
        }
      }

      //AfterStep
      let request = {
        status: context.stepStatus,
        end_time: reportportal.helpers.now()
      }
      if ('not_found' === request.status) {
        request.status = 'failed';
        request.issue = {
          issue_type: 'AUTOMATION_BUG', comment: "STEP DEFINITION WAS NOT FOUND"
        }
      }
      else if ('not_implemented' === request.status) {
        request.status = 'skipped';
        request.issue = {
          issue_type: 'TO_INVESTIGATE', comment: "STEP IS PENDING IMPLEMENTATION"
        }
      }

      reportportal.finishTestItem(context.stepId, request);
    });

    this.eventBroadcaster.on('test-step-attachment', (event) => {
      let sceenshotName = !context.stepDefinition ? 'UNDEFINED STEP' : `Failed at step definition line:${context.stepDefinition.line}`;
      if (event.data && event.data.length && (context.stepStatus === 'passed' || context.stepStatus === 'failed')) {
        switch (event.media.type) {
          case 'text/plain': {
            let logMessage = getJSON(event.data);
            let request = {
              time: reportportal.helpers.now()
            };
            if (logMessage) {
              request.level = logMessage.level;
              request.message = logMessage.message;
            } else {
              request.level = "DEBUG";
              request.message = event.data;
            }
            reportportal.sendLog(context.stepId, request);
            break;
          }
          case 'image/png': {
            let request = {
              time: reportportal.helpers.now(),
              level: context.stepStatus === 'passed' ? "DEBUG" : "ERROR"
            };
            let pngObj = getJSON(event.data);
            if (pngObj) {
              let fileObj = {
                name: pngObj.message,
                type: "image/png",
                content: pngObj.data
              }
              request.file = {name: pngObj.message};
              request.message = pngObj.message;
              reportportal.sendLog(context.stepId, request, fileObj);
            } else {
              request.file = {name: sceenshotName};
              request.message = sceenshotName;
              let fileObj = {
                name: sceenshotName,
                type: "image/png",
                content: attachment.data
              }
              reportportal.sendLog(context.stepId, request, fileObj);
            }
            break;
          }
        }
      }
    });

    this.eventBroadcaster.on('test-case-finished', (event) => {
      //ScenarioResult
      reportportal.finishTestItem(context.scenarioId, {
        status: event.result.status !== 'PASSED' ? 'failed' : 'passed',
        end_time: reportportal.helpers.now()
      });
      context.scenarioStatus = 'failed';
      context.scenarioId = null;
    });

    this.eventBroadcaster.on('test-run-finished', (event) => {
      // AfterFeature
      Object.entries(pickleDocuments).forEach(
        ([key, value]) => {
          let featureStatus = context.failedScenarios[key] > 0 ? 'failed' : 'passed';
          reportportal.finishTestItem(value.featureId, {
            status: featureStatus,
            end_time: reportportal.helpers.now()
          })
        }
      );

      // AfterFeatures
      let promise = reportportal.getPromiseFinishAllItems(context.launchId);
      resolveReportPortalPromise(promise);

      if (context.launchId) {
        let promise = reportportal.finishLaunch(context.launchId, {
          end_time: reportportal.helpers.now()
        }).promise;
        resolveReportPortalPromise(promise);
        context = cleanContext();
      }
    });
  }
  return reportPortalHandlers;
};