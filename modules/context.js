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
const itemFinders = require('./itemFinders');

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
    const stepDefinition = this.context.stepDefinitions.steps[event.index];

    if (stepDefinition.hookType) {
      stepObj = { keyword: stepDefinition.hookType };
    } else {
      this.context.scenario.steps.forEach((step) => {
        if (
          stepDefinition.sourceLocation.uri === event.testCase.sourceLocation.uri &&
          stepDefinition.sourceLocation.line === step.location.line
        ) {
          stepObj = step;
        }
      });

      if (this.context.background) {
        this.context.background.steps.forEach((step) => {
          if (
            stepDefinition.sourceLocation.uri === event.testCase.sourceLocation.uri &&
            stepDefinition.sourceLocation.line === step.location.line
          ) {
            stepObj = step;
          }
        });
      }
    }
    return stepObj;
  }

  countTotalScenarios(feature, featureUri) {
    let total = feature.children.length;
    feature.children.forEach((child) => {
      if (child.examples) {
        child.examples.forEach((ex) => {
          total += ex.tableBody.length - 1;
        });
      }
    });
    this.context.background = itemFinders.findBackground(feature);
    if (this.context.background) {
      total -= 1;
    }

    this.context.scenariosCount[featureUri] = { total, done: 0 };
  }

  incrementFailedScenariosCount(uri) {
    this.context.failedScenarios[uri] = this.context.failedScenarios[uri]
      ? this.context.failedScenarios[uri] + 1
      : 1;
  }

  resetContext() {
    this.context = cleanContext();
  }
}

module.exports = Context;
