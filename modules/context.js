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

const { STATUSES } = require('./constants');
const itemFinders = require('./itemFinders');

class Context {
  constructor() {
    this.initContext();
  }

  initContext() {
    this.outlineRow = 0;
    this.scenarioStatus = STATUSES.FAILED;
    this.forcedIssue = null;
    this.featureId = null;
    this.scenarioId = null;
    this.stepId = null;
    this.stepStatus = STATUSES.FAILED;
    this.launchId = null;
    this.background = null;
    this.failedScenarios = {};
    this.scenariosCount = {};
    this.lastScenarioDescription = null;
    this.scenario = null;
    this.step = null;
    this.stepSourceLocation = null;
    this.stepDefinitions = null;
    this.stepDefinition = null;
    this.itemsParams = {};
  }

  getFileName() {
    const fileName = this.stepDefinition
      ? `Failed at step definition line:${this.stepDefinition.line}`
      : 'UNDEFINED STEP';

    return fileName;
  }

  findStep(event) {
    let stepObj = null;
    const stepDefinition = this.stepDefinitions.steps[event.index];

    if (stepDefinition.hookType) {
      stepObj = { keyword: stepDefinition.hookType };
    } else {
      this.scenario.steps.forEach((step) => {
        if (
          stepDefinition.sourceLocation.uri === event.testCase.sourceLocation.uri &&
          stepDefinition.sourceLocation.line === step.location.line
        ) {
          stepObj = step;
        }
      });

      if (this.background) {
        this.background.steps.forEach((step) => {
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
    this.background = itemFinders.findBackground(feature);
    if (this.background) {
      total -= 1;
    }

    this.scenariosCount[featureUri] = { total, done: 0 };
  }

  incrementFailedScenariosCount(uri) {
    this.failedScenarios[uri] = this.failedScenarios[uri]
      ? this.failedScenarios[uri] + 1
      : 1;
  }

  resetContext() {
    this.initContext();
  }
}

module.exports = Context;
