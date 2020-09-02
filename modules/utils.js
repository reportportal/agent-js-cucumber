/*
 *  Copyright 2020 EPAM Systems
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

const path = require('path');

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

const getUri = (uri) => uri.replace(process.cwd() + path.sep, '');

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

// There is no reason for this to be a function which is executed each time it is called.
// Better to just assign it a variable value using the same logic since it is either
// true or false for an entire run and never changes.
const isScenarioBasedStatistics = typeof config.scenarioBasedStatistics === 'boolean' ? config.scenarioBasedStatistics : false;

const formatCodeRef = (pathName, itemName) => {
  const codeRef = pathName.replace(/\\/g, '/');

  return itemName ? `${codeRef}/${itemName}` : codeRef;
};

const getParameters = (header, body) => {
  const keys = header ? header.cells.map((cell) => cell.value) : [];

  if (Array.isArray(body)) {
    return body.reduce((acc, item) => {
      const params = item.cells.map((cell, index) => ({
        key: keys[index],
        value: cell.value,
      }));

      return acc.concat(params);
    }, []);
  }

  return body.cells.map((cell, index) => ({
    key: keys[index],
    value: cell.value,
  }));
};

function replaceParameter(originalString, name, value) {
  return originalString.replace(`<${name}>`, value);
}

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
  getParameters,
  formatCodeRef,
  replaceParameter,
};
