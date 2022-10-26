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
  it('detectLastScenario should return true', () => {
    const node = featureWithRule.children[0].rule;
    expect(utils.detectLastScenario(node, scenarioId)).toBe(true);
  });

  it('detectLastScenario should return false', () => {
    const node = featureWithRule.children[0].rule;
    node.children.push({ scenario: { id: 'abc' } });

    expect(utils.detectLastScenario(node, scenarioId)).toBe(false);
  });

  it('findNode return node by scenario id', () => {
    const expectedRes = feature.children[0];

    expect(utils.findNode(feature, scenarioId)).toBe(expectedRes);
  });

  it('findNode return node by scenario id from feature with rule', () => {
    const expectedRes = featureWithRule.children[0];

    expect(utils.findNode(featureWithRule, scenarioId)).toBe(expectedRes);
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
});
