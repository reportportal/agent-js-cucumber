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
  pickleWithParameters,
  testCaseWithParameters,
  ruleId,
  ruleTempId,
  hook,
  testCase,
  testCaseStarted,
  testCaseId,
  testStepId,
  gherkinDocumentWithRule,
  testStepStarted,
  testStepFinished,
  testCaseFinished,
  testCaseStartedId,
  feature,
  scenario,
  step,
} = require('./data');
const {
  STATUSES,
  TEST_ITEM_TYPES,
  CUCUMBER_MESSAGES,
  RP_EVENTS,
  RP_ENTITY_LAUNCH,
  TEST_STEP_FINISHED_RP_MESSAGES,
  LOG_LEVELS,
} = require('../modules/constants');

describe('cucumber-reportportal-formatter', () => {
  const config = getDefaultConfig();
  const FormatterClass = createRPFormatterClass(config);
  const formatter = new FormatterClass({
    parsedArgvOptions: {},
    eventBroadcaster: {
      on: () => {},
    },
  });

  beforeEach(() => {
    formatter.reportportal = new RPClientMock();
    formatter.storage = new Storage();
  });

  afterEach(() => {
    formatter.codeRefIndexesMap.clear();
  });

  describe('eventHandler', () => {
    it('onGherkinDocumentEvent should be called', () => {
      const spyOnGherkinDocumentEvent = jest
        .spyOn(formatter, 'onGherkinDocumentEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.GHERKIN_DOCUMENT]: gherkinDocument });

      expect(spyOnGherkinDocumentEvent).toBeCalledWith(gherkinDocument);
    });

    it('onPickleEvent should be called', () => {
      const spyOnPickleEvent = jest
        .spyOn(formatter, 'onPickleEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.PICKLE]: pickle });

      expect(spyOnPickleEvent).toBeCalledWith(pickle);
    });

    it('onHookEvent should be called', () => {
      const spyOnHookEvent = jest.spyOn(formatter, 'onHookEvent').mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.HOOK]: hook });

      expect(spyOnHookEvent).toBeCalledWith(hook);
    });

    it('onTestRunStartedEvent should be called', () => {
      const spyOnTestRunStartedEvent = jest
        .spyOn(formatter, 'onTestRunStartedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_RUN_STARTED]: {} });

      expect(spyOnTestRunStartedEvent).toBeCalled();
    });

    it('onTestCaseEvent should be called', () => {
      const spyOnTestCaseEvent = jest
        .spyOn(formatter, 'onTestCaseEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_CASE]: testCase });

      expect(spyOnTestCaseEvent).toBeCalledWith(testCase);
    });

    it('onTestCaseStartedEvent should be called', () => {
      const spyOnTestCaseStartedEvent = jest
        .spyOn(formatter, 'onTestCaseStartedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_CASE_STARTED]: testCaseStarted });

      expect(spyOnTestCaseStartedEvent).toBeCalledWith(testCaseStarted);
    });

    it('onTestStepStartedEvent should be called', () => {
      const spyOnTestStepStartedEvent = jest
        .spyOn(formatter, 'onTestStepStartedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_STEP_STARTED]: testStepStarted });

      expect(spyOnTestStepStartedEvent).toBeCalledWith(testStepStarted);
    });

    it('onTestStepAttachmentEvent should be called', () => {
      const testData = { id: 'test' };
      const spyOnTestStepAttachmentEvent = jest
        .spyOn(formatter, 'onTestStepAttachmentEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.ATTACHMENT]: testData });

      expect(spyOnTestStepAttachmentEvent).toBeCalledWith(testData);
    });

    it('onTestStepFinishedEvent should be called', () => {
      const spyOnTestStepFinishedEvent = jest
        .spyOn(formatter, 'onTestStepFinishedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_STEP_FINISHED]: testStepFinished });

      expect(spyOnTestStepFinishedEvent).toBeCalledWith(testStepFinished);
    });

    it('onTestCaseFinishedEvent should be called', () => {
      const spyOnTestCaseFinishedEvent = jest
        .spyOn(formatter, 'onTestCaseFinishedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_CASE_FINISHED]: testCaseFinished });

      expect(spyOnTestCaseFinishedEvent).toBeCalledWith(testCaseFinished);
    });

    it('onTestRunFinishedEvent should be called', () => {
      const testData = { id: 'test' };
      const spyOnTestRunFinishedEvent = jest
        .spyOn(formatter, 'onTestRunFinishedEvent')
        .mockImplementationOnce(() => {});
      formatter.eventHandler({ [CUCUMBER_MESSAGES.TEST_RUN_FINISHED]: testData });

      expect(spyOnTestRunFinishedEvent).toBeCalledWith(testData);
    });

    it('should return null if an unexpected event is received', () => {
      const result = formatter.eventHandler({ 'unexpected-event': {} });

      expect(result).toBeNull();
    });
  });

  describe('onGherkinDocumentEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
    });
    it('should set document to storage', () => {
      expect(formatter.storage.getDocument(uri)).toBe(gherkinDocument);
    });

    it('should set document feature.children', () => {
      expect(formatter.storage.getAstNodesData(uri)).toStrictEqual(scenario.steps);
    });
  });

  describe('onHookEvent', () => {
    it('should set hook to storage', () => {
      formatter.onHookEvent(hook);

      expect(formatter.storage.getHook(hook.id)).toBe(hook);
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

    it('startLaunch should be called with skippedIssue attribute', () => {
      const tempId = 'test-temp-id';
      const spyStartLaunch = jest.spyOn(formatter.reportportal, 'startLaunch');
      const { skippedIssue } = formatter.config;

      formatter.config.skippedIssue = false;
      formatter.onTestRunStartedEvent();
      formatter.config.skippedIssue = skippedIssue;

      expect(spyStartLaunch).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.arrayContaining([
            { key: 'skippedIssue', value: 'false', system: true },
          ]),
        }),
      );
    });
  });

  describe('onTestCaseEvent', () => {
    it('should set steps to storage under testCaseId', () => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      const expectedRes = {
        ...pickle.steps[0],
        type: TEST_ITEM_TYPES.STEP,
      };

      formatter.storage.setPickle(pickle);
      formatter.onTestCaseEvent(testCase);

      expect(formatter.storage.getStep(testCase.id, testStepId)).toEqual(expectedRes);
    });

    it('should set Before Hook to storage under testCaseId', () => {
      const data = { ...testCase, testSteps: [{ hookId: hook.id, id: testStepId }] };
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.storage.setHook(hook.id, hook);

      formatter.onTestCaseEvent(data);

      expect(formatter.storage.getStep(testCase.id, testStepId)).toEqual({
        text: hook.name,
        type: TEST_ITEM_TYPES.BEFORE_TEST,
      });
    });
  });

  describe('onTestCaseStartedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickleWithParameters);
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

    it('should finish previous FEATURE if currentFeatureUri is different from pickleFeatureUri', () => {
      const finishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const tempFeatureId = 'tempFeatureId';
      formatter.storage.setFeatureTempId(tempFeatureId);
      formatter.storage.setCurrentFeatureUri('currentFeatureUri');

      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(finishTestItem).toHaveBeenCalledWith(tempFeatureId, {
        endTime: mockedDate,
      });
    });

    it('should not finish FEATURE if pickleFeatureUri the same as currentFeatureUrl', () => {
      const finishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const tempFeatureId = 'tempFeatureId';
      formatter.storage.setFeatureTempId(tempFeatureId);
      formatter.storage.setCurrentFeatureUri(pickle.uri);

      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(finishTestItem).not.toHaveBeenCalled();
    });

    it('should start new FEATURE if it is first feature in this launch', () => {
      const finishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const tempFeatureId = 'tempFeatureId';
      formatter.storage.setFeatureTempId(tempFeatureId);

      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(finishTestItem).not.toHaveBeenCalled();
    });

    it('start scenario flow', () => {
      formatter.onTestCaseStartedEvent(testCaseStarted);

      expect(formatter.storage.getScenarioTempId(testCaseId)).toBe('testItemId');
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
          name: `${scenario.keyword}: ${scenario.name}`,
          startTime: mockedDate,
          type: 'TEST',
          codeRef: `${uri}/${feature.name}/${scenario.name}`,
          retry: false,
          parameters: [
            {
              key: scenario.examples[0].tableHeader.cells[0].value,
              value: scenario.examples[0].tableBody[0].cells[0].value,
            },
          ],
        },
        'tempLaunchId',
        'testItemId',
      );
    });

    it('should set isRetry for test case in storage if attempt > 0', () => {
      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestCaseStartedEvent({ ...testCaseStarted, attempt: 1 });

      expect(formatter.storage.getTestCase(testCaseId).isRetry).toEqual(true);
    });
  });

  describe('onTestStepStartedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocument);
      formatter.onPickleEvent(pickleWithParameters);
      formatter.onTestRunStartedEvent();
      formatter.onTestCaseEvent(testCaseWithParameters);
      formatter.onTestCaseStartedEvent(testCaseStarted);
    });

    it('startTestItem should be called', () => {
      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestStepStartedEvent(testStepStarted);

      expect(spyStartTestItem).lastCalledWith(
        {
          name: step.text,
          startTime: mockedDate,
          type: 'STEP',
          codeRef: `${uri}/${feature.name}/${scenario.name}/${step.text}`,
          parameters: [
            {
              key: scenario.examples[0].tableHeader.cells[0].value,
              value: scenario.examples[0].tableBody[0].cells[0].value,
            },
          ],
          hasStats: true,
          retry: false,
        },
        'tempLaunchId',
        'testItemId',
      );
    });
  });

  describe('onTestStepAttachmentEvent', () => {
    const launchTempId = 'launch-temp-id';
    const stepTempId = 'step-temp-id';
    const body = {
      entity: 'test-entity',
      status: 'test-status',
      description: 'test-description',
      level: 'test-level',
      message: 'test-message',
      data: 'test-data',
      attributes: ['attributes1', 'attributes2', 'attributes3'],
    };

    beforeEach(() => {
      formatter.storage.setTestCaseStartedId(testCaseStartedId, testCase.id);
      formatter.storage.setSteps(testCase.id, {
        [testStepId]: {},
      });
    });

    afterEach(() => {
      formatter.storage.removeTestCaseStartedId(testCaseStartedId);
      formatter.storage.removeSteps(testCase.id);
    });

    it('should update step in storage', () => {
      const data = {
        mediaType: RP_EVENTS.TEST_CASE_ID,
        testStepId,
        testCaseStartedId,
        body: JSON.stringify(body),
      };

      formatter.onTestStepAttachmentEvent(data);

      expect(formatter.storage.getStep(testCaseId, testStepId)).toEqual(body);
    });

    it('should update step attributes in storage', () => {
      const data = {
        mediaType: RP_EVENTS.ATTRIBUTES,
        testStepId,
        testCaseStartedId,
        body: JSON.stringify(body),
      };

      formatter.onTestStepAttachmentEvent(data);

      expect(formatter.storage.getStep(testCaseId, testStepId)).toEqual({
        attributes: body.attributes,
      });
    });

    it('should update step description in storage', () => {
      const data = {
        mediaType: RP_EVENTS.DESCRIPTION,
        testStepId,
        testCaseStartedId,
        body: JSON.stringify(body),
      };

      formatter.onTestStepAttachmentEvent(data);

      expect(formatter.storage.getStep(testCaseId, testStepId)).toEqual({
        description: body.description,
      });
    });

    it('should update step description in storage', () => {
      const data = {
        mediaType: RP_EVENTS.DESCRIPTION,
        testStepId,
        testCaseStartedId,
        body: JSON.stringify(body),
      };

      formatter.onTestStepAttachmentEvent(data);

      expect(formatter.storage.getStep(testCaseId, testStepId)).toEqual({
        description: body.description,
      });
    });

    describe('Status event handling', () => {
      it('should update step in storage', () => {
        const data = {
          mediaType: RP_EVENTS.STATUS,
          testStepId,
          testCaseStartedId,
          body: JSON.stringify(body),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(formatter.storage.getStep(testCaseId, testStepId)).toEqual(body);
      });

      it('should set status in customLaunchStatus field', () => {
        const status = 'start';
        const data = {
          mediaType: RP_EVENTS.STATUS,
          testStepId,
          testCaseStartedId,
          body: JSON.stringify({ ...body, entity: RP_ENTITY_LAUNCH, status }),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(formatter.customLaunchStatus).toEqual(status);
      });
    });

    describe('text/plain event handling', () => {
      it('sendLog should be called', () => {
        jest.spyOn(formatter.storage, 'getStepTempId').mockImplementationOnce(() => stepTempId);
        const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

        const data = {
          mediaType: 'text/plain',
          testStepId,
          testCaseStartedId,
          body: JSON.stringify(body),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(spySendLog).toHaveBeenCalledWith(stepTempId, {
          time: mockedDate,
          level: body.level,
          message: body.message,
        });
      });

      it('sendLog should be called with launch temp id', () => {
        jest.spyOn(formatter.storage, 'getLaunchTempId').mockImplementationOnce(() => launchTempId);
        const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

        const data = {
          mediaType: 'text/plain',
          testStepId,
          testCaseStartedId,
          body: JSON.stringify({ ...body, entity: RP_ENTITY_LAUNCH }),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(spySendLog).toHaveBeenCalledWith(launchTempId, {
          time: mockedDate,
          level: body.level,
          message: body.message,
        });
      });

      it('sendLog should be called with body like message and debug level', () => {
        jest.spyOn(formatter.storage, 'getStepTempId').mockImplementationOnce(() => stepTempId);
        const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

        const data = {
          mediaType: 'text/plain',
          testStepId,
          testCaseStartedId,
          body: 'not-json-body',
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(spySendLog).toHaveBeenCalledWith(stepTempId, {
          time: mockedDate,
          level: LOG_LEVELS.DEBUG,
          message: data.body,
        });
      });
    });

    describe('default handling', () => {
      const fileName = 'file';
      const mediaType = 'unexpected-media-type';

      it('sendLog should be called', () => {
        jest.spyOn(formatter.storage, 'getStepTempId').mockImplementationOnce(() => stepTempId);
        const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

        const data = {
          mediaType,
          testStepId,
          testCaseStartedId,
          body: JSON.stringify(body),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(spySendLog).toHaveBeenCalledWith(
          stepTempId,
          {
            time: mockedDate,
            level: body.level,
            message: body.message,
            file: {
              name: body.message,
            },
          },
          {
            name: fileName,
            type: mediaType,
            content: body.data,
          },
        );
      });

      it('sendLog should be called with launch temp id', () => {
        jest.spyOn(formatter.storage, 'getLaunchTempId').mockImplementationOnce(() => launchTempId);
        const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

        const data = {
          mediaType,
          testStepId,
          testCaseStartedId,
          body: JSON.stringify({ ...body, entity: RP_ENTITY_LAUNCH }),
        };

        formatter.onTestStepAttachmentEvent(data);

        expect(spySendLog).toHaveBeenCalledWith(
          launchTempId,
          {
            time: mockedDate,
            level: body.level,
            message: body.message,
            file: {
              name: body.message,
            },
          },
          {
            name: fileName,
            type: mediaType,
            content: body.data,
          },
        );
      });
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

    describe('FAILED status', () => {
      const originBrowser = global.browser;
      const png = 'base64-data';

      beforeAll(() => {
        global.browser = {
          takeScreenshot: jest.fn().mockImplementation(() => Promise.resolve(png)),
        };
      });

      afterAll(() => {
        global.browser = originBrowser;
      });

      it('finishTestItem should be called with failed status, clean storage', () => {
        const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

        formatter.onTestStepFinishedEvent(testStepFinished);

        expect(spyFinishTestItem).toBeCalledWith('testItemId', {
          endTime: mockedDate,
          status: STATUSES.FAILED,
          description: '```error\nerror message\n```',
        });
        expect(formatter.storage.getStepTempId(testStepStarted.testStepId)).toBeUndefined();
      });

      it('should make screenshot if takeScreenshot === onFailure', () => {
        const originTakeScreenshot = formatter.config.takeScreenshot;

        const spyTakeScreenshot = jest.spyOn(global.browser, 'takeScreenshot');

        formatter.config.takeScreenshot = 'onFailure';
        formatter.onTestStepFinishedEvent(testStepFinished);
        formatter.config.takeScreenshot = originTakeScreenshot;

        expect(spyTakeScreenshot).toBeCalled();
      });
    });

    it('finishTestItem should be called with passed status, clean storage', () => {
      const spyfinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: STATUSES.PASSED },
      });

      expect(spyfinishTestItem).toBeCalledWith(
        'testItemId',
        expect.objectContaining({
          status: STATUSES.PASSED,
        }),
      );
      expect(formatter.storage.getStepTempId(testStepStarted.testStepId)).toBeUndefined();
    });

    it('finishTestItem should be called with unexpected status', () => {
      const spyfinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: 'unexpected-status' },
      });

      expect(spyfinishTestItem).toBeCalledWith(
        'testItemId',
        expect.objectContaining({
          status: 'unexpected-status',
        }),
      );
    });

    it('finishTestItem should be called with NOT_ISSUE type if SKIPPED status and skippedIssue set to false', () => {
      const spyfinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.config.skippedIssue = false;
      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: STATUSES.SKIPPED },
      });

      expect(spyfinishTestItem).toBeCalledWith(
        'testItemId',
        expect.objectContaining({ status: STATUSES.SKIPPED, issue: { issueType: 'NOT_ISSUE' } }),
      );
    });

    it('should set failed status for test case in storage if isScenarioBasedStatistics === true', () => {
      const originIsScenarioBasedStatistics = formatter.isScenarioBasedStatistics;
      formatter.isScenarioBasedStatistics = true;

      formatter.onTestStepFinishedEvent(testStepFinished);
      formatter.isScenarioBasedStatistics = originIsScenarioBasedStatistics;

      expect(formatter.storage.getTestCase(testCaseId).status).toEqual(STATUSES.FAILED);
    });

    it('sendLog should be called with pending message in case of corresponding status received', () => {
      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: STATUSES.PENDING },
      });

      expect(spySendLog).toBeCalledWith('testItemId', {
        time: mockedDate,
        level: LOG_LEVELS.WARN,
        message: TEST_STEP_FINISHED_RP_MESSAGES.PENDING,
      });
    });

    it('sendLog should be called with undefined message in case of corresponding status received', () => {
      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: STATUSES.UNDEFINED },
      });

      expect(spySendLog).toBeCalledWith('testItemId', {
        time: mockedDate,
        level: LOG_LEVELS.ERROR,
        message: TEST_STEP_FINISHED_RP_MESSAGES.UNDEFINED,
      });
    });

    it('sendLog should be called with ambiguous message in case of corresponding status received', () => {
      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepFinishedEvent({
        ...testStepFinished,
        testStepResult: { ...testStepFinished.testStepResult, status: STATUSES.AMBIGUOUS },
      });

      expect(spySendLog).toBeCalledWith('testItemId', {
        time: mockedDate,
        level: LOG_LEVELS.ERROR,
        message: TEST_STEP_FINISHED_RP_MESSAGES.AMBIGUOUS,
      });
    });
  });

  describe('onTestCaseFinishedEvent', () => {
    beforeEach(() => {
      formatter.onGherkinDocumentEvent(gherkinDocumentWithRule);
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
        endTime: mockedDate,
        status: STATUSES.FAILED,
        description: '```error\nerror message\n```',
      });
      expect(formatter.storage.getTestCaseId(testCaseStartedId)).toBe(undefined);
      expect(formatter.storage.getStep(testCaseId, testStepId)).toBe(undefined);
      expect(formatter.storage.getTestCase(testCaseId)).toBe(undefined);
      expect(formatter.storage.getScenarioTempId(testCaseStartedId)).toBeUndefined();
    });

    it('should not finishTestItem if this is scenarioBaseStatistics or test case willBeRetried', () => {
      const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const testCaseWithReties = { ...testCaseFinished, willBeRetried: true };
      spyFinishTestItem.mockReset();
      formatter.onTestCaseFinishedEvent(testCaseWithReties);

      expect(spyFinishTestItem).not.toHaveBeenCalled();
      expect(formatter.storage.getTestCaseId(testCaseStartedId)).not.toBeUndefined();
      expect(formatter.storage.getStep(testCaseId, testStepId)).not.toBeUndefined();
      expect(formatter.storage.getTestCase(testCaseId)).not.toBeUndefined();
      expect(formatter.storage.getScenarioTempId()).not.toBeNull();
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
        endTime: mockedDate,
      });
      expect(spyGetPromiseFinishAllItems).toBeCalledWith('tempLaunchId');

      expect(formatter.storage.getLaunchTempId()).toBeNull();
      expect(formatter.storage.getCurrentFeatureUri()).toBeNull();
      expect(formatter.storage.getFeatureTempId()).toBeNull();
    });
  });
});
