const { cleanContext } = require('./utils');

class Context {
  constructor() {
    this.resetContext();
  }

  getFileName() {
    const fileName = this.context.stepDefinition
      ? `Failed at step definition line:${this.context.stepDefinition.line}`
      : 'UNDEFINED STEP';

    return fileName;
  }

  findStep(event) {
    let stepObj = null;
    const stepSourceLocation = this.context.stepDefinitions.steps[event.index];

    if (stepSourceLocation.sourceLocation) {
      this.context.isBeforeHook = false;
      this.context.scenario.steps.forEach((step) => {
        if (
          stepSourceLocation.sourceLocation.uri === event.testCase.sourceLocation.uri &&
          stepSourceLocation.sourceLocation.line === step.location.line
        ) {
          stepObj = step;
        }
      });

      if (this.context.background) {
        this.context.background.steps.forEach((step) => {
          if (
            stepSourceLocation.sourceLocation.uri === event.testCase.sourceLocation.uri &&
            stepSourceLocation.sourceLocation.line === step.location.line
          ) {
            stepObj = step;
          }
        });
      }
    } else {
      stepObj = { keyword: this.context.isBeforeHook ? 'Before' : 'After' };
    }
    return stepObj;
  }

  countFailedScenarios(uri) {
    if (this.context.failedScenarios[uri]) {
      this.context.failedScenarios[uri]++;
    } else {
      this.context.failedScenarios[uri] = 1;
    }
  }

  resetContext() {
    this.context = cleanContext();
  }
}

module.exports = Context;
