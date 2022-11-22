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

const path = require('path');
const commonUtils = require('../../utils');

const getUri = (uri) => uri.replace(process.cwd() + path.sep, '');

const createTagComparator = (tagA) => (tagB) =>
  tagB.name === tagA.name &&
  tagB.location.line === tagA.location.line &&
  tagB.location.column === tagA.location.column;

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

module.exports = {
  createTagComparator,
  getUri,
  createAttributes: commonUtils.createAttributes(),
  getJSON: commonUtils.getJSON(),
  getStepType,
  getParameters,
  formatCodeRef: commonUtils.formatCodeRef(),
  replaceParameter,
};
