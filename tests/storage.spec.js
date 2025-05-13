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

const Storage = require('../modules/storage');
const {
  launchTempId,
  feature,
  pickleId,
  uri,
  pickle,
  testCase,
  testCaseId,
  testCaseStarted,
  testCaseStartedId,
  testStepId,
  step,
  featureTempId,
  scenarioTempId,
  stepTempId,
  ruleTempId,
  hookId,
  hook,
  ruleId,
  featureWithRule,
} = require('./data');

describe('test Storage', () => {
  let storage;
  beforeEach(() => {
    storage = new Storage();
  });

  it('set/getLaunchTempId', () => {
    storage.setLaunchTempId(launchTempId);

    expect(storage.getLaunchTempId()).toBe(launchTempId);
  });

  it('set/getFeature', () => {
    storage.setFeature(uri, feature);

    expect(storage.getFeature(uri)).toEqual(feature);
  });

  it('set/deleteFeature', () => {
    storage.setFeature(uri, feature);
    storage.deleteFeature(uri);

    expect(storage.getFeature(uri)).toBeUndefined();
  });

  it('set/getPickle', () => {
    storage.setPickle(pickle);

    expect(storage.getPickle(pickleId)).toEqual(pickle);
  });

  it('set/getHook', () => {
    storage.setHook(hookId, hook);

    expect(storage.getHook(hookId)).toEqual(hook);
  });

  it('set/getTestCase', () => {
    storage.setTestCase(testCase);

    expect(storage.getTestCase(testCaseId)).toEqual(testCase);
  });

  it('updateTestCase', () => {
    const newData = { newField: true };
    storage.updateTestCase(testCaseId, newData);

    expect(storage.getTestCase(testCaseId)).toMatchObject(newData);
  });

  it('removeTestCase', () => {
    storage.setTestCase(testCase);
    storage.removeTestCase(testCaseId);

    expect(storage.getTestCase(testCaseId)).toBeUndefined();
  });

  it('setTestCaseStartedId and getTestCaseId by testCaseStartedId', () => {
    storage.setTestCaseStartedId(testCaseStartedId, testCaseStarted.testCaseId);

    expect(storage.getTestCaseId(testCaseStartedId)).toEqual(testCaseId);
  });

  it('removeTestCaseStartedId', () => {
    storage.setTestCaseStartedId(testCaseStartedId, testCaseStarted.testCaseId);
    storage.removeTestCaseStartedId(testCaseStartedId);

    expect(storage.getTestCaseId(testCaseStartedId)).toBeUndefined();
  });

  it('set/getStep', () => {
    storage.setSteps(testCaseId, {
      [testStepId]: step,
    });

    expect(storage.getStep(testCaseId, testStepId)).toEqual(step);
  });

  it('removeSteps', () => {
    storage.setSteps(testCaseId, {
      [testStepId]: step,
    });
    storage.removeSteps(testCaseId);

    expect(storage.getStep(testCaseId, testStepId)).toBeUndefined();
  });

  it('updateStep', () => {
    const newData = { newStepField: true };
    storage.setSteps(testCaseId, {
      [testStepId]: step,
    });
    storage.updateStep(testCaseId, testStepId, newData);

    expect(storage.getStep(testCaseId, testStepId)).toMatchObject(newData);
  });

  it('set/getFeatureTempId', () => {
    storage.setFeature(uri, { tempId: featureTempId });

    expect(storage.getFeatureTempId(uri)).toBe(featureTempId);
  });

  it('set/getActiveFeatureUris', () => {
    storage.setFeature(uri, { ...feature, tempId: featureTempId });

    expect(storage.getActiveFeatureUris()).toEqual([uri]);
  });

  it('set/getScenario', () => {
    storage.setScenario(testCaseStartedId, { tempId: scenarioTempId });

    expect(storage.getScenario(testCaseStartedId)).toEqual({ tempId: scenarioTempId });
  });

  it('set/removeScenario', () => {
    storage.setScenario(testCaseStartedId, { tempId: scenarioTempId });
    storage.removeScenario(testCaseStartedId);

    expect(storage.getScenario(testCaseStartedId)).toBeUndefined();
  });

  it('set/getStepTempId', () => {
    storage.setStepTempId(testStepId, stepTempId);

    expect(storage.getStepTempId(testStepId)).toBe(stepTempId);
  });

  it('set/removeStepTempId', () => {
    storage.setStepTempId(testStepId.stepTempId);
    storage.removeStepTempId(testCaseStartedId);

    expect(storage.removeStepTempId(testStepId)).toBeUndefined();
  });

  it('set/getRuleTempId', () => {
    storage.setRuleTempId(ruleId, ruleTempId);

    expect(storage.getRuleTempId(ruleId)).toBe(ruleTempId);
  });

  it('set/removeRuleTempId', () => {
    storage.setRuleTempId(ruleId, ruleTempId);
    storage.removeRuleTempId(ruleId);

    expect(storage.removeRuleTempId(ruleId)).toBeUndefined();
  });

  it('set/getRuleTempIdToTestCase', () => {
    storage.setRuleTempIdToTestCase(testCaseStartedId, ruleTempId);

    expect(storage.getRuleTempIdToTestCase(testCaseStartedId)).toBe(ruleTempId);
  });

  it('set/removeRuleTempIdToTestCase', () => {
    storage.setRuleTempIdToTestCase(testCaseStartedId, ruleTempId);
    storage.removeRuleTempIdToTestCase(testCaseStartedId);

    expect(storage.getRuleTempIdToTestCase(testCaseStartedId)).toBeUndefined();
  });

  it('set/getRuleChildrenIds', () => {
    const ruleChildren = featureWithRule.children.map((child) => child.rule.children);
    storage.setRuleChildrenIds(ruleTempId, ruleChildren);

    expect(storage.getRuleChildrenIds(ruleTempId)).toStrictEqual(ruleChildren);
  });

  it('set/removeRuleTempIdToTestCase', () => {
    const ruleChildren = featureWithRule.children.map((child) => child.rule.children);
    storage.setRuleChildrenIds(ruleTempId, ruleChildren);
    storage.removeRuleChildrenIds(ruleTempId);

    expect(storage.getRuleChildrenIds(ruleTempId)).toStrictEqual([]);
  });
});
