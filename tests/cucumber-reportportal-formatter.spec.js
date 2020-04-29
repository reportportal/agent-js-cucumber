const { createRPFormatterClass } = require('../modules');
const {
  ContextMock,
  DocumentsStorageMock,
  RPClientMock,
  getDefaultConfig,
  mockedDate,
} = require('./mocks');
const itemFinders = require('../modules/itemFinders');
const utils = require('../modules/utils');
const { AFTER_HOOK_URI_TO_SKIP, STATUSES } = require('../modules/constants');

const featureMock = {
  description: 'feature description',
  keyword: 'ft',
  name: 'feature',
  tags: ['@feature:value'],
  children: [],
};

describe('Create ReportPortal formatter class', function() {
  let FormatterClass;
  let formatter;

  beforeEach(() => {
    const config = getDefaultConfig();

    FormatterClass = createRPFormatterClass(config);

    formatter = new FormatterClass({
      parsedArgvOptions: {},
      eventBroadcaster: {
        on: () => {},
      },
    });

    formatter.contextState = new ContextMock();
    formatter.documentsStorage = new DocumentsStorageMock();
    formatter.reportportal = new RPClientMock();
    formatter.attributesConf = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onGherkinDocument', () => {
    const documentEvent = {
      uri: 'mockUri',
      document: 'any',
      pickle: null,
    };

    test('should call cacheDocument method from documents storage to cache the document', function() {
      const spyCacheDocument = jest.spyOn(formatter.documentsStorage, 'cacheDocument');

      formatter.onGherkinDocument(documentEvent);

      expect(spyCacheDocument).toHaveBeenCalledWith(documentEvent);
    });

    test('should call startLaunch method from RPClient if not launchId in the config', function() {
      const launchStartObj = {
        name: 'LauncherName',
        startTime: mockedDate,
        description: 'Launch description',
        attributes: [],
        rerun: undefined,
        rerunOf: undefined,
      };

      const spyStartLaunch = jest.spyOn(formatter.reportportal, 'startLaunch');

      formatter.onGherkinDocument(documentEvent);

      expect(spyStartLaunch).toHaveBeenCalledWith(launchStartObj);
      expect(formatter.contextState.context.launchId).toBe('tempLaunchId');
    });

    test('should not call startLaunch method from RPClient if launchId exists in the config', function() {
      formatter.contextState.context.launchId = 'tempLaunchId';
      const spyStartLaunch = jest.spyOn(formatter.reportportal, 'startLaunch');

      formatter.onGherkinDocument(documentEvent);

      expect(spyStartLaunch).toHaveBeenCalledTimes(0);
    });
  });

  describe('onPickleAccepted', () => {
    const uriMock = 'featureUri';
    const documentEvent = {
      uri: uriMock,
      document: 'any',
      pickle: null,
    };

    beforeAll(() => {
      jest.spyOn(itemFinders, 'findFeature').mockImplementation(() => featureMock);
      jest.spyOn(itemFinders, 'findBackground').mockReturnValue(null);
      jest.spyOn(utils, 'getUri').mockReturnValue(uriMock);
      jest.spyOn(utils, 'createAttribute').mockReturnValue([{ key: 'feature', value: 'value' }]);
    });

    beforeEach(() => {
      formatter.documentsStorage.pickleDocuments[uriMock] = {};
    });

    test('should call isAcceptedPickleCached method from documents storage with event', function() {
      const spyIsAcceptedPickleCached = jest.spyOn(
        formatter.documentsStorage,
        'isAcceptedPickleCached',
      );

      formatter.onPickleAccepted(documentEvent);

      expect(spyIsAcceptedPickleCached).toHaveBeenCalledWith(documentEvent);
    });

    test('should call cacheAcceptedPickle method from documents storage if pickle not cached', function() {
      const spyCacheAcceptedPickle = jest.spyOn(formatter.documentsStorage, 'cacheAcceptedPickle');

      formatter.onPickleAccepted(documentEvent);

      expect(spyCacheAcceptedPickle).toHaveBeenCalledWith(documentEvent);
    });

    test('should not call cacheAcceptedPickle method from documents storage if pickle cached', function() {
      jest.spyOn(formatter.documentsStorage, 'isAcceptedPickleCached').mockReturnValue(true);

      const spyCacheAcceptedPickle = jest.spyOn(formatter.documentsStorage, 'cacheAcceptedPickle');

      formatter.onPickleAccepted(documentEvent);

      expect(spyCacheAcceptedPickle).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTestCasePrepared', () => {
    test('should set stepDefinitions and isBeforeHook for the context', function() {
      const event = {
        data: 'any',
      };

      formatter.onTestCasePrepared(event);

      expect(formatter.contextState.context.stepDefinitions).toEqual(event);
      expect(formatter.contextState.context.isBeforeHook).toBe(true);
    });
  });

  describe('onTestCaseStarted', () => {
    const uriMock = 'featureUri';
    const documentEvent = {
      uri: uriMock,
      document: 'any',
      name: 'lol',
      keyword: 'loc',
      description: 'description',
      sourceLocation: {
        uri: uriMock,
      },
    };
    const pickleTags = [
      {
        name: '@feature:value',
        location: {
          line: 1,
          column: 1,
        },
      },
    ];
    let spyFindScenario;
    let spyGetUri;
    let spyCreateAttributes;
    let spyCreateTagComparator;

    beforeAll(() => {
      spyFindScenario = jest
        .spyOn(itemFinders, 'findScenario')
        .mockImplementation(() => featureMock);
      spyGetUri = jest.spyOn(utils, 'getUri').mockReturnValue(uriMock);
      spyCreateAttributes = jest
        .spyOn(utils, 'createAttributes')
        .mockReturnValue([{ key: 'feature', value: 'value' }]);
      spyCreateTagComparator = jest
        .spyOn(utils, 'createTagComparator')
        .mockReturnValue(() => false);
    });

    beforeEach(() => {
      formatter.documentsStorage.pickleDocuments[uriMock] = {
        featureId: 'featureId',
        tags: pickleTags,
      };
      formatter.documentsStorage.gherkinDocuments[uriMock] = {
        feature: {
          tags: [],
        },
      };
    });

    test('should call findScenario with gherkinDocuments & sourceLocation', function() {
      formatter.onTestCaseStarted(documentEvent);

      expect(spyFindScenario).toHaveBeenCalledWith(
        formatter.documentsStorage.gherkinDocuments,
        documentEvent.sourceLocation,
      );
    });

    test('should call getUri with uri from event sourceLocation', function() {
      formatter.onTestCaseStarted(documentEvent);

      expect(spyGetUri).toHaveBeenCalledWith(documentEvent.sourceLocation.uri);
    });

    test('should call createTagComparator with pickle tag value', function() {
      formatter.onTestCaseStarted(documentEvent);

      expect(spyCreateTagComparator).toHaveBeenCalledWith(pickleTags[0]);
    });

    test('should call createAttributes with pickleTags', function() {
      formatter.onTestCaseStarted(documentEvent);

      expect(spyCreateAttributes).toHaveBeenCalledWith(pickleTags);
    });

    test('should call startTestItem method from RPClient if isScenarioBasedStatistics is true', function() {
      formatter.isScenarioBasedStatistics = true;

      const itemStartObj = {
        name: 'ft: feature',
        type: 'STEP',
        startTime: mockedDate,
        description: 'feature description',
        attributes: [{ key: 'feature', value: 'value' }],
        retry: false,
      };

      formatter.contextState.context.launchId = 'tempLaunchId';
      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestCaseStarted(documentEvent);

      expect(spyStartTestItem).toHaveBeenCalledWith(itemStartObj, 'tempLaunchId', 'featureId');
    });

    test('should call startTestItem method from RPClient if isScenarioBasedStatistics is false and attemptNumber from event <=2', function() {
      formatter.isScenarioBasedStatistics = false;

      const itemStartObj = {
        name: 'ft: feature',
        type: 'TEST',
        startTime: mockedDate,
        description: 'feature description',
        attributes: [{ key: 'feature', value: 'value' }],
        retry: false,
      };

      formatter.contextState.context.launchId = 'tempLaunchId';

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestCaseStarted({
        ...documentEvent,
        attemptNumber: 1,
      });

      expect(spyStartTestItem).toHaveBeenCalledWith(itemStartObj, 'tempLaunchId', 'featureId');
    });

    test('should not call startTestItem method from RPClient if isScenarioBasedStatistics is false and attemptNumber from event >=2', function() {
      formatter.isScenarioBasedStatistics = false;

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestCaseStarted({
        ...documentEvent,
        attemptNumber: 2,
      });

      expect(spyStartTestItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTestStepStarted', () => {
    const stepMock = {
      keyword: 'stepExample',
    };
    const stepDefinitionMock = {
      name: 'stepDefinition',
    };
    const event = {
      index: 0,
      testCase: {
        attemptNumber: 1,
      },
    };

    let spyFindStep;
    let spyFindStepDefinition;
    let spyGetStepType;

    beforeAll(() => {
      spyFindStepDefinition = jest
        .spyOn(itemFinders, 'findStepDefinition')
        .mockImplementation(() => stepDefinitionMock);
      spyGetStepType = jest.spyOn(utils, 'getStepType').mockReturnValue('STEP');
    });

    beforeEach(() => {
      spyFindStep = jest
        .spyOn(formatter.contextState, 'findStep')
        .mockImplementation(() => stepMock);
      formatter.contextState.context.stepDefinitions = {
        steps: [
          {
            sourceLocation: {},
          },
        ],
      };
    });

    test('should call findStep function to find step for context', function() {
      formatter.onTestStepStarted(event);

      expect(spyFindStep).toHaveBeenCalledWith(event);
      expect(formatter.contextState.context.step).toEqual(stepMock);
    });

    test('should call findStepDefinition function to find step definition for context', function() {
      formatter.onTestStepStarted(event);

      expect(spyFindStepDefinition).toHaveBeenCalledWith(formatter.contextState.context, event);
      expect(formatter.contextState.context.stepDefinition).toEqual(stepDefinitionMock);
    });

    test('should call getStepType function to get type for step', function() {
      formatter.onTestStepStarted(event);

      expect(spyGetStepType).toHaveBeenCalledWith(stepMock.keyword);
    });

    test('should call startTestItem method from RPClient', function() {
      formatter.contextState.context.launchId = 'launchId';
      formatter.contextState.context.scenarioId = 'scenarioId';
      formatter.isScenarioBasedStatistics = false;

      const itemStartObj = {
        name: stepMock.keyword,
        type: 'STEP',
        startTime: mockedDate,
        description: '',
        hasStats: true,
        retry: false,
      };

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestStepStarted(event);

      expect(spyStartTestItem).toHaveBeenCalledWith(itemStartObj, 'launchId', 'scenarioId');
      expect(formatter.contextState.context.stepId).toBe('testItemId');
    });

    test('should not call startTestItem method and stop function execution', function() {
      formatter.contextState.context.stepDefinitions = {
        steps: [
          {
            actionLocation: {
              uri: `uri: ${AFTER_HOOK_URI_TO_SKIP}`,
            },
          },
        ],
      };

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'startTestItem');

      formatter.onTestStepStarted(event);

      expect(spyFindStep).toHaveBeenCalledTimes(0);
      expect(spyFindStepDefinition).toHaveBeenCalledTimes(0);
      expect(spyGetStepType).toHaveBeenCalledTimes(0);
      expect(spyStartTestItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTestStepFinished', () => {
    const event = {
      result: {
        status: 'passed',
      },
      testCase: {
        attemptNumber: 1,
        sourceLocation: { uri: 'testCaseUri' },
      },
    };

    let spyGetFileName;
    let spyCountFailedScenarios;

    beforeEach(() => {
      spyGetFileName = jest.spyOn(formatter.contextState, 'getFileName');
      spyCountFailedScenarios = jest
        .spyOn(formatter.contextState, 'countFailedScenarios')
        .mockImplementation(() => {});
      formatter.contextState.context.stepSourceLocation = { sourceLocation: {} };
    });

    test('should call spyGetFileName to get name for screenshot', function() {
      formatter.onTestStepFinished(event);

      expect(spyGetFileName).toHaveBeenCalledTimes(1);
    });

    test('should set passed status for step and scenario in case of passed result status', function() {
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.PASSED);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.PASSED);
    });

    test('should call sendLog method from RPClient with WARN level in case of pending result status', function() {
      event.result.status = STATUSES.PENDING;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      expect(spySendLog).toHaveBeenCalledWith('stepId', {
        time: mockedDate,
        level: 'WARN',
        message: "This step is marked as 'pending'",
      });
    });

    test('should set not_implemented status for step and failed for scenario in case of pending result status', function() {
      event.result.status = STATUSES.PENDING;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.NOT_IMPLEMENTED);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.FAILED);
      expect(spyCountFailedScenarios).toHaveBeenCalledWith(event.testCase.sourceLocation.uri);
    });

    test('should call sendLog method from RPClient with ERROR level in case of undefined result status', function() {
      event.result.status = STATUSES.UNDEFINED;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      expect(spySendLog).toHaveBeenCalledWith('stepId', {
        time: mockedDate,
        level: 'ERROR',
        message: 'There is no step definition found. Please verify and implement it.',
      });
    });

    test('should set not_found status for step and failed for scenario in case of undefined result status', function() {
      event.result.status = STATUSES.UNDEFINED;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.NOT_FOUND);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.FAILED);
      expect(spyCountFailedScenarios).toHaveBeenCalledWith(event.testCase.sourceLocation.uri);
    });

    test('should call sendLog method from RPClient with ERROR level in case of ambiguous result status', function() {
      event.result.status = STATUSES.AMBIGUOUS;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      expect(spySendLog).toHaveBeenCalledWith('stepId', {
        time: mockedDate,
        level: 'ERROR',
        message: 'There are more than one step implementation. Please verify and reimplement it.',
      });
    });

    test('should set not_found status for step and failed for scenario in case of ambiguous result status', function() {
      event.result.status = STATUSES.AMBIGUOUS;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.NOT_FOUND);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.FAILED);
      expect(spyCountFailedScenarios).toHaveBeenCalledWith(event.testCase.sourceLocation.uri);
    });

    test('should set skipped status for step in case of skipped result status', function() {
      event.result.status = STATUSES.SKIPPED;
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.SKIPPED);
    });

    test('should set skipped status for scenario if it was failed in case of skipped result status', function() {
      event.result.status = STATUSES.SKIPPED;
      formatter.contextState.context.scenarioStatus = STATUSES.FAILED;
      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.SKIPPED);
    });

    test('should call sendLog method from RPClient with ERROR level in case of failed result status', function() {
      event.result.status = STATUSES.FAILED;
      event.result.exception = 255;
      const stepDefinitionMock = {
        uri: 'stepDefinition',
      };

      formatter.contextState.context.stepDefinition = stepDefinitionMock;
      formatter.contextState.context.stepId = 'stepId';
      formatter.onTestStepFinished(event);

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      expect(spySendLog).toHaveBeenCalledWith('stepId', {
        time: mockedDate,
        level: 'ERROR',
        message: `${stepDefinitionMock.uri}\n 255`,
      });
    });

    test('should set failed status for step in case of failed result status', function() {
      event.result.status = STATUSES.FAILED;
      formatter.contextState.context.stepDefinition = {
        uri: 'stepDefinition',
      };

      formatter.onTestStepFinished(event);

      expect(formatter.contextState.context.stepStatus).toBe(STATUSES.FAILED);
      expect(spyCountFailedScenarios).toHaveBeenCalledWith(event.testCase.sourceLocation.uri);
    });

    test('should call finishTestItem method from RPClient', function() {
      event.result.status = STATUSES.PASSED;
      formatter.contextState.context.stepId = 'stepId';

      const itemFinishObj = {
        status: STATUSES.PASSED,
        endTime: mockedDate,
      };

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinished(event);

      expect(spyStartTestItem).toHaveBeenCalledWith('stepId', itemFinishObj);
    });

    test('should call finishTestItem method from RPClient with ab001 issue in case of not_found step status', function() {
      event.result.status = STATUSES.UNDEFINED;
      formatter.contextState.context.stepId = 'stepId';

      const itemFinishObj = {
        status: STATUSES.FAILED,
        endTime: mockedDate,
        issue: {
          issueType: 'ab001',
          comment: 'STEP DEFINITION WAS NOT FOUND',
        },
      };

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinished(event);

      expect(spyStartTestItem).toHaveBeenCalledWith('stepId', itemFinishObj);
    });

    test('should call finishTestItem method from RPClient with ti001 issue in case of not_implemented step status', function() {
      event.result.status = STATUSES.PENDING;
      formatter.contextState.context.stepId = 'stepId';

      const itemFinishObj = {
        status: STATUSES.SKIPPED,
        endTime: mockedDate,
        issue: {
          issueType: 'ti001',
          comment: 'STEP IS PENDING IMPLEMENTATION',
        },
      };

      const spyStartTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.onTestStepFinished(event);

      expect(spyStartTestItem).toHaveBeenCalledWith('stepId', itemFinishObj);
    });

    test('should not call finishTestItem method and stop function execution', function() {
      formatter.contextState.context.stepSourceLocation = {
        actionLocation: {
          uri: `uri: ${AFTER_HOOK_URI_TO_SKIP}`,
        },
      };

      const spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');
      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepFinished(event);

      expect(spyGetFileName).toHaveBeenCalledTimes(0);
      expect(spyCountFailedScenarios).toHaveBeenCalledTimes(0);
      expect(spySendLog).toHaveBeenCalledTimes(0);
      expect(spyFinishTestItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTestStepAttachment', () => {
    const mockFileObj = {
      level: 'INFO',
      message: 'file',
      data: 'string',
    };
    const event = {
      data: [
        {
          item: 'text',
        },
      ],
    };

    const spyGetJSON = jest.spyOn(utils, 'getJSON');
    let spyGetFileName;

    beforeEach(() => {
      spyGetFileName = jest
        .spyOn(formatter.contextState, 'getFileName')
        .mockImplementation(() => 'fileName');

      formatter.contextState.context.stepStatus = STATUSES.PASSED;
      formatter.contextState.context.stepId = 'stepId';
    });

    test('should call spyGetFileName to get name for file', function() {
      event.media = {
        type: 'text/plain',
      };
      spyGetJSON.mockImplementationOnce(() => mockFileObj);
      formatter.onTestStepAttachment(event);

      expect(spyGetFileName).toHaveBeenCalledTimes(1);
    });

    test('should call sendLog method from RPClient to send log with attachment for text media type', function() {
      event.media = {
        type: 'text/plain',
      };
      spyGetJSON.mockImplementationOnce(() => mockFileObj);

      const request = {
        level: mockFileObj.level,
        message: mockFileObj.message,
        time: mockedDate,
      };

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepAttachment(event);

      expect(spySendLog).toHaveBeenCalledWith('stepId', request);
    });

    test('should call sendLog method from RPClient with DEBUG level log in case of invalid json data for text media type', function() {
      event.media = {
        type: 'text/plain',
      };
      spyGetJSON.mockImplementationOnce(() => false);

      const request = {
        level: 'DEBUG',
        message: event.data,
        time: mockedDate,
      };

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepAttachment(event);

      expect(spySendLog).toHaveBeenCalledWith('stepId', request);
    });

    test('should call sendLog method from RPClient to send log with attachment for other media type', function() {
      event.media = {
        type: 'other',
      };
      spyGetJSON.mockImplementationOnce(() => mockFileObj);

      const request = {
        level: mockFileObj.level,
        message: mockFileObj.message,
        time: mockedDate,
        file: {
          name: mockFileObj.message,
        },
      };
      const fileObj = {
        name: 'fileName',
        type: 'other',
        content: mockFileObj.data,
      };

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepAttachment(event);

      expect(spySendLog).toHaveBeenCalledWith('stepId', request, fileObj);
    });

    test('should call sendLog method from RPClient with default parameters in case of invalid json data for other media type', function() {
      event.media = {
        type: 'other',
      };
      spyGetJSON.mockImplementationOnce(() => false);

      const request = {
        level: 'DEBUG',
        message: 'fileName',
        time: mockedDate,
        file: {
          name: 'fileName',
        },
      };
      const fileObj = {
        name: 'fileName',
        type: 'other',
        content: event.data,
      };

      const spySendLog = jest.spyOn(formatter.reportportal, 'sendLog');

      formatter.onTestStepAttachment(event);

      expect(spySendLog).toHaveBeenCalledWith('stepId', request, fileObj);
    });
  });

  describe('onTestCaseFinished', () => {
    const itemUri = 'itemUri';
    const event = {
      sourceLocation: {
        uri: itemUri,
      },
      result: {
        status: STATUSES.PASSED,
      },
    };

    let spyFinishTestItem;

    beforeEach(() => {
      spyFinishTestItem = jest.spyOn(formatter.reportportal, 'finishTestItem');

      formatter.isScenarioBasedStatistics = false;
      formatter.contextState.context.scenarioId = 'scenarioId';
      formatter.contextState.context.scenariosCount[itemUri] = {
        done: 0,
        total: 2,
      };

      formatter.documentsStorage.pickleDocuments[itemUri] = {
        featureId: 'featureId',
      };
    });

    test('should call finishTestItem method from RPClient to finish test item', function() {
      formatter.onTestCaseFinished(event);

      const itemFinishObj = {
        status: STATUSES.PASSED,
        endTime: mockedDate,
      };

      expect(spyFinishTestItem).toHaveBeenCalledWith('scenarioId', itemFinishObj);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.FAILED);
      expect(formatter.contextState.context.scenarioId).toBe(null);
    });

    test('should call finishTestItem method from RPClient and finish test item with failed status in case of result status not passed', function() {
      event.result.status = STATUSES.SKIPPED;
      formatter.onTestCaseFinished(event);

      const itemFinishObj = {
        status: STATUSES.FAILED,
        endTime: mockedDate,
      };

      expect(spyFinishTestItem).toHaveBeenCalledWith('scenarioId', itemFinishObj);
      expect(formatter.contextState.context.scenarioStatus).toBe(STATUSES.FAILED);
      expect(formatter.contextState.context.scenarioId).toBe(null);
    });

    test('should increase scenariosCount done in context', function() {
      event.result.status = STATUSES.PASSED;
      formatter.onTestCaseFinished(event);

      expect(formatter.contextState.context.scenariosCount[itemUri].done).toBe(1);
    });

    test('should call finishTestItem method from RPClient twice in case of finishing the item from suite', function() {
      formatter.contextState.context.scenariosCount[itemUri].total = 1;
      formatter.contextState.context.failedScenarios[itemUri] = 0;

      event.result.status = STATUSES.PASSED;
      formatter.onTestCaseFinished(event);

      const finishItemObj = {
        status: STATUSES.PASSED,
        endTime: mockedDate,
      };

      expect(spyFinishTestItem).toHaveBeenCalledTimes(2);
      expect(spyFinishTestItem).toHaveBeenNthCalledWith(2, 'featureId', finishItemObj);
    });

    test('should call finishTestItem method from RPClient second time with failed status in case of failed scenarios in suite', function() {
      formatter.contextState.context.scenariosCount[itemUri].total = 1;
      formatter.contextState.context.failedScenarios[itemUri] = 1;

      event.result.status = STATUSES.PASSED;
      formatter.onTestCaseFinished(event);

      const finishItemObj = {
        status: STATUSES.FAILED,
        endTime: mockedDate,
      };

      expect(spyFinishTestItem).toHaveBeenCalledTimes(2);
      expect(spyFinishTestItem).toHaveBeenNthCalledWith(2, 'featureId', finishItemObj);
    });

    test('should not call finishTestItem method and stop function execution', function() {
      formatter.isScenarioBasedStatistics = false;
      event.result.retried = true;

      formatter.onTestCaseFinished(event);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('onTestRunFinished', () => {
    let spyGetPromiseFinishAllItems;
    let spyFinishLaunch;

    beforeEach(() => {
      spyGetPromiseFinishAllItems = jest.spyOn(formatter.reportportal, 'getPromiseFinishAllItems');
      spyFinishLaunch = jest.spyOn(formatter.reportportal, 'finishLaunch');
    });

    test('should call getPromiseFinishAllItems method from RPClient & should not call finishLaunch method for empty launch id', function() {
      formatter.contextState.context.launchId = null;

      formatter.onTestRunFinished();

      expect(spyGetPromiseFinishAllItems).toHaveBeenCalledWith(null);
      expect(spyFinishLaunch).toHaveBeenCalledTimes(0);
    });

    test('should call getPromiseFinishAllItems method from RPClient and should finish launch with corresponding id', async function() {
      formatter.contextState.context.launchId = 'launchId';
      await formatter.onTestRunFinished();

      expect(spyGetPromiseFinishAllItems).toHaveBeenCalledWith('launchId');
      expect(spyFinishLaunch).toHaveBeenCalledWith('launchId', { endTime: mockedDate });
    });

    test('should call resetContext method from context after finishing launch', async function() {
      formatter.contextState.context.launchId = 'launchId';
      const spyResetContext = jest.spyOn(formatter.contextState, 'resetContext');

      await formatter.onTestRunFinished();

      expect(spyResetContext).toHaveBeenCalledTimes(1);
    });
  });
});
