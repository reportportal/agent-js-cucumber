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

const { createRPFormatterClass } = require('../modules');
const { RPClientMock, getDefaultConfig, mockedDate } = require('./mocks');
const Storage = require('../modules/storage');
const {
  gherkinDocument,
  uri,
  pickle,
  testCase,
  testCaseStarted,
  testCaseId,
  testStepId,
  gherkinDocumentWithRule,
  testStepStarted,
  testStepFinished,
  testCaseFinished,
  testCaseStartedId,
} = require('./data');
const { STATUSES } = require('../modules/constants');

describe('cucumber-reportportal-formatter', () => {
  let FormatterClass;
  let formatter;
  const config = getDefaultConfig();

  FormatterClass = createRPFormatterClass(config);
  formatter = new FormatterClass({
    parsedArgvOptions: {},
    eventBroadcaster: {
      on: () => {},
    },
  });

  beforeEach(() => {
    formatter.reportportal = new RPClientMock();
    formatter.storage = new Storage();
  });

  describe('onGherkinDocumentEvent', () => {
    it('should set document to storage', () => {
      formatter.onGherkinDocumentEvent(gherkinDocument);

      expect(formatter.storage.getDocument(uri)).toBe(gherkinDocument);
    });
  });

  describe('onPickleEvent', () => {
    it('should set pickle to storage', () => {
      formatter.onPickleEvent(pickle);

      expect(formatter.storage.getPickle(pickle.id)).toBe(pickle);
    });
  });

  describe('onTestRunStartedEvent', () => {
    it('should set launchTempId to storage', () => {
      formatter.onTestRunStartedEvent();

      expect(formatter.storage.getLaunchTempId()).toBe('tempLaunchId');
    });
  });

  describe('onTestCaseEvent', () => {
    it('should set steps to storage under testCaseId', () => {
      const expectedRes = pickle.steps[0];

      formatter.storage.setPickle(pickle);
      formatter.onTestCaseEvent(testCase);

      expect(formatter.storage.getStep(testCase.id, testStepId)).toBe(expectedRes);
    });
  });

  describe('onTestCaseStartedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickle);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCase);
    });

    it('should set setTestCaseStartedId-testCaseId map to storage', () => {
      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(formatter.storage.getTestCaseId(testCaseStarted.id)).toBe(testCase.id);
    });

    it('should start FEATURE if no currentFeatureUri or new feature', () => {
      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(formatter.storage.getFeatureTempId()).toBe('testItemId');
    });

    it('should finish FEATURE if has currentFeatureUri', () => {
      const finishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const tempFeatureId = 'tempFeatureId';
      formatter.storage.setFeatureTempId(tempFeatureId);
      formatter.storage.setCurrentFeatureUri(pickle.uri);

      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(finishTestItem).toHaveBeenCalledWith(tempFeatureId, {
        endTime: formatter.reportportal.helpers.now(),
      });
    });

    it('start scenario flow', () => {
      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(formatter.storage.getScenarioTempId()).toBe('testItemId');
    });

    it('start rule flow', () => {
      formatter.onGherkinDocumentEvent(gherkinDocumentWithRule);
      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(formatter.storage.getRuleTempId()).toBe('testItemId');
    });

    it('startTestItem should be called', () => {
      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(spyStartTestItem).lastCalledWith(
        {
          attributes: [],
          description: undefined,
          name: 'scenario name',
          startTime: mockedDate,
          type: 'TEST',
        },
        'tempLaunchId',
        'testItemId',
      );
    });
  });

  describe('onTestStepStartedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickle);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCase);
      formatter.onTestCaseStartedEvent(testCaseStarted);
    });

    it('startTestItem should be called', () => {
      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestStepStartedEvent(testStepStarted);

      expect(spyStartTestItem).lastCalledWith(
        { name: 'I put "true"', startTime: mockedDate, type: 'STEP' },
        'tempLaunchId',
        'testItemId',
      );
    });
  });

  describe('onTestStepFinishedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickle);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCase);
      formatter.onTestCaseStartedEvent(testCaseStarted);
      formatter.onTestStepStartedEvent(testStepStarted);
    });

    it('finishTestItem should be called, clean storage', () => {
      const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinishedEvent(testStepFinished);

      expect(spyFinishTestItem).toBeCalledWith('testItemId', {
        endTime: mockedDate,
        status: STATUSES.FAILED,
      });
      expect(formatter.storage.getStepTempId()).toBe(null);
    });
  });

  describe('onTestCaseFinishedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickle);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCase);
      formatter.onTestCaseStartedEvent(testCaseStarted);
      formatter.onTestStepStartedEvent(testStepStarted);
      formatter.onTestStepFinishedEvent(testStepFinished);
    });

    it('finishTestItem should be called, clean storage', () => {
      const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestCaseFinishedEvent(testCaseFinished);

      expect(spyFinishTestItem).toBeCalledWith('testItemId', {
        endTime: formatter.reportportal.helpers.now(),
        status: STATUSES.FAILED,
      });
      expect(formatter.storage.getTestCaseId(testCaseStartedId)).toBe(undefined);
      expect(formatter.storage.getStep(testCaseId, testStepId)).toBe(undefined);
      expect(formatter.storage.getTestCase(testCaseId)).toBe(undefined);
      expect(formatter.storage.getScenarioTempId()).toBeNull();
    });
  });

  describe('onTestRunFinishedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickle);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCase);
      formatter.onTestCaseStartedEvent(testCaseStarted);
      formatter.onTestStepStartedEvent(testStepStarted);
      formatter.onTestStepFinishedEvent(testStepFinished);
      formatter.onTestCaseFinishedEvent(testCaseFinished);
    });

    it('finishTestItem, getPromiseFinishAllItems should be called, clean storage', async () => {
      const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const spyGetPromiseFinishAllItems = jest.spyOn(
        formatter.reportportal,
        'getPromiseFinishAllItems',
      );

      await formatter.onTestRunFinishedEvent();

      expect(spyFinishTestItem).lastCalledWith('testItemId', {
        endTime: formatter.reportportal.helpers.now(),
      });
      expect(spyGetPromiseFinishAllItems).toBeCalledWith('tempLaunchId');

      expect(formatter.storage.getLaunchTempId()).toBeNull();
      expect(formatter.storage.getCurrentFeatureUri()).toBeNull();
      expect(formatter.storage.getFeatureTempId()).toBeNull();
    });
  });
});
