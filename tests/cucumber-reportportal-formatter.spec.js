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
    let spyCreateAttribute;
    let spyCreateTagComparator;

    beforeAll(() => {
      spyFindScenario = jest
        .spyOn(itemFinders, 'findScenario')
        .mockImplementation(() => featureMock);
      spyGetUri = jest.spyOn(utils, 'getUri').mockReturnValue(uriMock);
      spyCreateAttribute = jest
        .spyOn(utils, 'createAttribute')
        .mockReturnValue({ key: 'feature', value: 'value' });
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

    test('should call createAttribute with pickle tag name', function() {
      formatter.onTestCaseStarted(documentEvent);

      expect(spyCreateAttribute).toHaveBeenCalledWith(pickleTags[0].name);
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

});
