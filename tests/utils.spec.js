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

const utils = require('../modules/utils');
const { scenarioId, featureWithRule, feature } = require('./data');

describe('utils', () => {
  describe('getJSON', () => {
    it('getJSON should return object from JSON', () => {
      const json = '{"key": "value"}';
      const expectedRes = { key: 'value' };
      expect(utils.getJSON(json)).toEqual(expectedRes);
    });

    it('getJSON should return false if param not JSON', () => {
      expect(utils.getJSON()).toBeFalsy();
    });
  });

  it('createAttribute should return attribute object from tag string', () => {
    expect(utils.createAttribute('@key:value')).toEqual({ key: 'key', value: 'value' });
    expect(utils.createAttribute('value')).toEqual({ value: 'value' });
    expect(utils.createAttribute()).toEqual({ value: '' });
  });

  describe('createAttributes', () => {
    it('createAttributes should return array of attributes', () => {
      const tag = [{ name: '@platform:windows10' }];

      expect(utils.createAttributes(tag)).toEqual([{ key: 'platform', value: 'windows10' }]);
    });

    it('createAttributes should return an empty array if no argument was passed', () => {
      expect(utils.createAttributes()).toEqual([]);
    });
  });

  describe('formatCodeRef', () => {
    const pathName = 'feature\\check-title';

    it('formatCodeRef should return formatted code reference', () => {
      expect(utils.formatCodeRef(pathName)).toBe('feature/check-title');
    });

    it('formatCodeRef should return formatted code reference with item name', () => {
      expect(utils.formatCodeRef(pathName, 'Go to the web site')).toBe(
        'feature/check-title/Go to the web site',
      );
    });
  });

  describe('detectLastScenario', () => {
    it('detectLastScenario should return true', () => {
      const node = featureWithRule.children[0].rule;

      expect(utils.detectLastScenario(node, scenarioId)).toBe(true);
    });

    it('detectLastScenario should return false', () => {
      const node = featureWithRule.children[0].rule;
      node.children.push({ scenario: { id: 'abc' } });

      expect(utils.detectLastScenario(node, scenarioId)).toBe(false);
    });
  });

  describe('findNode', () => {
    it('findNode return node by scenario id', () => {
      const expectedRes = feature.children[0];

      expect(utils.findNode(feature, scenarioId)).toBe(expectedRes);
    });

    it('findNode return node by scenario id from feature with rule', () => {
      const expectedRes = featureWithRule.children[0];

      expect(utils.findNode(featureWithRule, scenarioId)).toBe(expectedRes);
    });
  });

  it('findScenario return scenario obj by scenario id', () => {
    const node = featureWithRule.children[0].rule;
    const expectedRes = node.children[0].scenario;

    expect(utils.findScenario(node, scenarioId)).toBe(expectedRes);
  });

  it('bindToClass should add method to class', () => {
    const module = {
      newMethod() {},
    };
    class Test {
      constructor() {
        utils.bindToClass(module, this);
      }
    }
    const instance = new Test();

    expect(instance.newMethod).toBeTruthy();
  });

  it('collectParams should create map from tableHeader & tableBody', () => {
    const tableHeader = {
      cells: [{ value: 'parameterKey' }],
    };
    const tableBody = [
      {
        id: '7ecb2351-5f6d-495b-b995-aa9366f5fe52',
        cells: [{ value: 'parameterValue' }],
      },
    ];
    const expectedRes = {
      '7ecb2351-5f6d-495b-b995-aa9366f5fe52': [{ key: 'parameterKey', value: 'parameterValue' }],
    };

    expect(utils.collectParams({ tableHeader, tableBody })).toEqual(expectedRes);
  });
  it('findAstNodesData should create an array of astNodeObjects which contains step information', () => {
    const children = [
      {
        rule: {
          children: [
            {
              scenario: {
                steps: [
                  { keyword: 'Then ', id: 'scenarioStepId' },
                  { keyword: 'When ', id: 'scenarioStepId' },
                ],
              },
            },
          ],
        },
      },
    ];
    const expectedResult = [
      { keyword: 'Then ', id: 'scenarioStepId' },
      { keyword: 'When ', id: 'scenarioStepId' },
    ];

    expect(utils.findAstNodesData(children)).toStrictEqual(expectedResult);
  });
});
