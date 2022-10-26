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
  return originalString.replace(new RegExp(`<${name}>`, 'g'), value);
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

const findNode = (feature, searchId) => {
  return feature.children.find((child) => {
    if (child.rule) {
      return child.rule.children.find((item) => {
        if (!item.scenario) return false;
        return item.scenario.id === searchId;
      });
    }
    if (child.scenario) {
      return child.scenario.id === searchId;
    }
    return null;
  });
};

const detectLastScenario = (node, searchId) => {
  let isLastScenario = false;
  node.children.forEach((child, index) => {
    if (child.scenario) {
      isLastScenario = child.scenario.id === searchId && index === node.children.length - 1;
    }
  });
  return isLastScenario;
};

const findScenario = (node, searchId) => {
  const children = node.children.find((child) => {
    if (child.scenario) {
      return child.scenario.id === searchId;
    }
    return null;
  });
  return children.scenario;
};

const bindToClass = (module, thisClass) => {
  const that = thisClass;
  Object.entries(module).forEach((method) => {
    const [key, value] = method;
    that[key] = value.bind(that);
  });
};

module.exports = {
  createTagComparator,
  createAttribute,
  createAttributes,
  getUri,
  getJSON,
  getStepType,
  getParameters,
  formatCodeRef,
  replaceParameter,
  findNode,
  findScenario,
  detectLastScenario,
  bindToClass,
};
