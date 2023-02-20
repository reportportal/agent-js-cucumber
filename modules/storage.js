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
    this.currentFeatureUri = null;
    this.featureTempId = null;
    this.documents = new Map();
    this.pickles = new Map();
    this.hooks = new Map();
    this.testCases = new Map();
    this.testCaseStartedIds = new Map();
    this.steps = new Map();
    this.parameters = new Map();
    this.astNodesData = new Map();
    this.scenarioTempId = new Map();
    this.stepTempId = new Map();
    this.ruleTempId = new Map();
    this.ruleTempIdToTestCaseStartedId = new Map();
    this.startedRuleChildren = new Map();
    this.ruleChildrenIds = new Map();
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

    return document && document.feature;
  }

  setPickle(pickle) {
    this.pickles.set(pickle.id, pickle);
  }

  getPickle(id) {
    return this.pickles.get(id);
  }

  setHook(id, data) {
    this.hooks.set(id, data);
  }

  getHook(id) {
    return this.hooks.get(id);
  }

  setTestCase(testCase) {
    this.testCases.set(testCase.id, testCase);
  }

  getTestCase(id) {
    return this.testCases.get(id);
  }

  updateTestCase(id, data) {
    const testCase = this.testCases.get(id);
    const newTestCaseData = { ...testCase, ...data };
    this.testCases.set(id, newTestCaseData);
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
    return steps && steps[testStepId];
  }

  updateStep(testCaseId, testStepId, data) {
    const steps = this.steps.get(testCaseId);
    const newStepsData = { ...steps };
    newStepsData[testStepId] = { ...newStepsData[testStepId], ...data };
    this.steps.set(testCaseId, newStepsData);
  }

  setParameters(id, data) {
    this.parameters.set(id, data);
  }

  getParameters(id) {
    return this.parameters.get(id);
  }

  setFeatureTempId(value) {
    this.featureTempId = value;
  }

  getFeatureTempId() {
    return this.featureTempId;
  }

  setScenarioTempId(testCaseStartedId, scenarioTempId) {
    this.scenarioTempId.set(testCaseStartedId, scenarioTempId);
  }

  getScenarioTempId(testCaseStartedId) {
    return this.scenarioTempId.get(testCaseStartedId);
  }

  removeScenarioTempId(testCaseStartedId) {
    this.scenarioTempId.delete(testCaseStartedId);
  }

  setStepTempId(parentId, value) {
    this.stepTempId.set(parentId, value);
  }

  getStepTempId(parentId) {
    return this.stepTempId.get(parentId);
  }

  removeStepTempId(parentId) {
    this.stepTempId.delete(parentId);
  }

  setAstNodesData({ uri }, astNodesData) {
    this.astNodesData.set(uri, astNodesData);
  }

  getAstNodesData(uri) {
    return this.astNodesData.get(uri);
  }

  getRuleTempId(ruleId) {
    return this.ruleTempId.get(ruleId);
  }

  setRuleTempId(ruleId, ruleTempId) {
    this.ruleTempId.set(ruleId, ruleTempId);
  }

  removeRuleTempId(ruleId) {
    this.ruleTempId.delete(ruleId);
  }

  setRuleTempIdToTestCase(testCaseStartedId, ruleTempId) {
    this.ruleTempIdToTestCaseStartedId.set(testCaseStartedId, ruleTempId);
  }

  getRuleTempIdToTestCase(testCaseStartedId) {
    return this.ruleTempIdToTestCaseStartedId.get(testCaseStartedId);
  }

  removeRuleTempIdToTestCase(testCaseStartedId) {
    this.ruleTempIdToTestCaseStartedId.delete(testCaseStartedId);
  }

  getStartedRuleChildren(ruleTempId) {
    return this.startedRuleChildren.get(ruleTempId) || new Set();
  }

  setStartedRuleChildren(ruleTempId, child) {
    this.startedRuleChildren.set(ruleTempId, this.getStartedRuleChildren(ruleTempId).add(child));
  }

  removeStartedRuleChildren(ruleTempId) {
    this.startedRuleChildren.delete(ruleTempId);
  }

  setRuleChildrenIds(ruleTempId, children) {
    this.ruleChildrenIds.set(ruleTempId, children);
  }

  getRuleChildrenIds(ruleTempId) {
    return this.ruleChildrenIds.get(ruleTempId) || [];
  }

  removeRuleChildrenIds(ruleTempId) {
    this.ruleChildrenIds.delete(ruleTempId);
  }
};
