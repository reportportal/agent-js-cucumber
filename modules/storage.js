/*
 *  Copyright 2022 EPAM Systems
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

module.exports = class Storage {
  constructor() {
    this.launchTempId = null;
    this.documents = new Map();
    this.pickles = new Map();
    this.testCases = new Map();
    this.testCaseStartedIds = new Map();
    this.steps = new Map();
    this.currentFeatureUri = null;
    this.featureTempId = null;
    this.ruleTempId = null;
    this.scenarioTempId = null;
    this.stepTempId = null;
    this.isLastScenario = false;
  }

  setLaunchTempId(id) {
    this.launchTempId = id;
  }

  getLaunchTempId() {
    return this.launchTempId;
  }

  getCurrentFeatureUri() {
    return this.currentFeatureUri;
  }

  setCurrentFeatureUri(value) {
    this.currentFeatureUri = value;
  }

  setDocument(gherkinDocument) {
    this.documents.set(gherkinDocument.uri, gherkinDocument);
  }

  getDocument(uri) {
    return this.documents.get(uri);
  }

  getFeature(uri) {
    const document = this.getDocument(uri);

    return document.feature;
  }

  setPickle(pickle) {
    this.pickles.set(pickle.id, pickle);
  }

  getPickle(id) {
    return this.pickles.get(id);
  }

  setTestCase(testCase) {
    this.testCases.set(testCase.id, testCase);
  }

  getTestCase(id) {
    return this.testCases.get(id);
  }

  removeTestCase(id) {
    this.testCases.delete(id);
  }

  setTestCaseStartedId(id, testCaseId) {
    this.testCaseStartedIds.set(id, testCaseId);
  }

  removeTestCaseStartedId(id) {
    this.testCaseStartedIds.delete(id);
  }

  getTestCaseId(id) {
    return this.testCaseStartedIds.get(id);
  }

  setSteps(testCaseId, data) {
    this.steps.set(testCaseId, data);
  }

  removeSteps(testCaseId) {
    this.steps.delete(testCaseId);
  }

  getStep(testCaseId, testStepId) {
    const steps = this.steps.get(testCaseId);
    return steps[testStepId];
  }

  setFeatureTempId(value) {
    this.featureTempId = value;
  }

  getFeatureTempId() {
    return this.featureTempId;
  }

  setScenarioTempId(id) {
    this.scenarioTempId = id;
  }

  getScenarioTempId() {
    return this.scenarioTempId;
  }

  setStepTempId(value) {
    this.stepTempId = value;
  }

  getStepTempId() {
    return this.stepTempId;
  }

  setRuleTempId(id) {
    this.ruleTempId = id;
  }

  getRuleTempId() {
    return this.ruleTempId;
  }

  setLastScenario(val) {
    this.isLastScenario = val;
  }

  getLastScenario() {
    return this.isLastScenario;
  }
};
