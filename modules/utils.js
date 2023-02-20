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

const formatCodeRef = (pathName, itemName) => {
  const codeRef = pathName.replace(/\\/g, '/');

  return itemName ? `${codeRef}/${itemName}` : codeRef;
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

const isAllRuleChildrenStarted = (allScenarios, startedScenarios) =>
  allScenarios.every((scenarioId) => startedScenarios.has(scenarioId));

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

const collectParams = ({ tableHeader, tableBody }) => {
  const { cells: headerCells } = tableHeader;
  return tableBody.reduce((map, row) => {
    const { id, cells: rowCells } = row;

    const rowData = rowCells.reduce((acc, cell, i) => {
      return {
        ...acc,
        [id]: [...(acc[id] || []), { key: headerCells[i].value, value: cell.value }],
      };
    }, {});

    return {
      ...map,
      ...rowData,
    };
  }, {});
};

const findAstNodesData = (children) => {
  const flattenChildren = children.reduce(
    (acc, child) => acc.concat('rule' in child ? child.rule.children : child),
    [],
  );

  return flattenChildren.reduce((acc, child) => {
    const childValues = Object.values(child);
    return acc.concat(childValues.map((childValue) => childValue.steps).flat());
  }, []);
};

const getScreenshotName = (astNodesData, astNodesIds) => {
  const location =
    astNodesIds && (astNodesData.find(({ id }) => astNodesIds.includes(id)) || {}).location;

  return location
    ? `Failed at step definition line:${location.line} column:${location.column}`
    : 'UNDEFINED STEP';
};

module.exports = {
  createAttribute,
  createAttributes,
  getJSON,
  formatCodeRef,
  findNode,
  findScenario,
  isAllRuleChildrenStarted,
  bindToClass,
  collectParams,
  findAstNodesData,
  getScreenshotName,
};
