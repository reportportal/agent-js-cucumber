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
  gherkinDocument,
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

  it('set/getCurrentFeatureUri', () => {
    storage.setCurrentFeatureUri(uri);

    expect(storage.getCurrentFeatureUri()).toBe(uri);
  });

  it('set/getDocument', () => {
    storage.setDocument(gherkinDocument);

    expect(storage.getDocument(uri)).toEqual(gherkinDocument);
  });

  it('set/getFeature', () => {
    storage.setDocument(gherkinDocument);

    expect(storage.getFeature(uri)).toEqual(feature);
  });

  it('set/getPickle', () => {
    storage.setPickle(pickle);

    expect(storage.getPickle(pickleId)).toEqual(pickle);
  });

  it('set/getTestCase', () => {
    storage.setTestCase(testCase);

    expect(storage.getTestCase(testCaseId)).toEqual(testCase);
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

  it('set/getFeatureTempId', () => {
    storage.setFeatureTempId(featureTempId);

    expect(storage.getFeatureTempId()).toBe(featureTempId);
  });

  it('set/getScenarioTempId', () => {
    storage.setScenarioTempId(scenarioTempId);

    expect(storage.getScenarioTempId()).toBe(scenarioTempId);
  });

  it('set/getStepTempId', () => {
    storage.setStepTempId(stepTempId);

    expect(storage.getStepTempId()).toBe(stepTempId);
  });

  it('set/getRuleTempId', () => {
    storage.setRuleTempId(ruleTempId);

    expect(storage.getRuleTempId()).toBe(ruleTempId);
  });

  it('set/getLastScenario value', () => {
    storage.setLastScenario(true);

    expect(storage.getLastScenario()).toBe(true);
  });
});
