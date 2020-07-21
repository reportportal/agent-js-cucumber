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
