const Path = require('path');

const getJSON = (json) => {
  try {
    const jsonObject = JSON.parse(json);
    if (jsonObject && typeof jsonObject === 'object') {
      return jsonObject;
    }
  } catch (error) {
    // eslint-disable-line no-empty
  }
  return false;
};

const getUri = (uri) => uri.replace(process.cwd() + Path.sep, '');

const cleanContext = () => ({
  outlineRow: 0,
  scenarioStatus: 'failed',
  forcedIssue: null,
  featureId: null,
  scenarioId: null,
  stepId: null,
  stepStatus: 'failed',
  launchId: null,
  background: null,
  failedScenarios: {},
  scenariosCount: {},
  lastScenarioDescription: null,
  scenario: null,
  step: null,
  stepSourceLocation: null,
  stepDefinitions: null,
  stepDefinition: null,
  isBeforeHook: true,
});

const createAttribute = (tag = '') => {
  const parsedTag = tag.replace('@', '').split(':');
  let attribute = null;
  if (parsedTag.length > 1) {
    attribute = {
      key: parsedTag[0],
      value: parsedTag[1],
    };
  } else {
    attribute = {
      value: parsedTag[0],
    };
  }
  return attribute;
};

const createAttributes = (items) => (items ? items.map((item) => createAttribute(item.name)) : []);

const createTagComparator = (tagA) => (tagB) =>
  tagB.name === tagA.name &&
  tagB.location.line === tagA.location.line &&
  tagB.location.column === tagA.location.column;

const isScenarioBasedStatistics = (config) =>
  typeof config.scenarioBasedStatistics === 'boolean' ? config.scenarioBasedStatistics : false;

const getStepType = (keyword) => {
  let type;

  switch (keyword) {
    case 'Before':
      type = 'BEFORE_TEST';
      break;
    case 'After':
      type = 'AFTER_TEST';
      break;
    default:
      type = 'STEP';
      break;
  }

  return type;
};

module.exports = {
  createTagComparator,
  createAttribute,
  createAttributes,
  isScenarioBasedStatistics,
  getUri,
  getJSON,
  getStepType,
  cleanContext,
};
