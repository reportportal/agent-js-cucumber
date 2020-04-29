// eslint-disable-next-line max-classes-per-file
const { cleanContext } = require('../modules/utils');

const mockedDate = Date.now();

class ContextMock {
  constructor() {
    this.context = cleanContext();

    this.findStep = jest.fn().mockReturnValue({
      keyword: 'anyKeyWord',
    });

    this.countFailedScenarios = jest.fn();

    this.getFileName = jest.fn().mockReturnValue('fileName');
  }
}

class DocumentsStorageMock {
  constructor() {
    this.gherkinDocuments = {};
    this.pickleDocuments = {};

    this.cacheDocument = jest.fn().mockReturnValue({
      keyword: 'anyKeyWord',
    });

    this.cacheAcceptedPickle = jest.fn();

    this.isAcceptedPickleCached = jest.fn().mockReturnValue(false);
  }
}

class RPClientMock {
  constructor(config) {
    this.config = config;
    this.helpers = {
      now: () => mockedDate,
    };

    this.startLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'tempLaunchId',
    });

    this.finishLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.startTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'testItemId',
    });

    this.finishTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.sendLog = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });
  }
}

const getDefaultConfig = () => ({
  token: '00000000-0000-0000-0000-000000000000',
  endpoint: 'https://reportportal.server/api/v1',
  project: 'ProjectName',
  launch: 'LauncherName',
  description: 'Launch description',
  attributes: [],
});

module.exports = {
  ContextMock,
  DocumentsStorageMock,
  RPClientMock,
  getDefaultConfig,
  mockedDate,
};
