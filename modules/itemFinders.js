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

const utils = require('./utils');

function createSteps(header, row, steps) {
  return steps.map((step) => {
    const modified = { ...step, parameters: [] };

    header.cells.forEach((varable, index) => {
      const isParameterPresents = modified.text.indexOf(`<${varable.value}>`) !== -1;
      modified.text = modified.text.replace(`<${varable.value}>`, row.cells[index].value);

      if (isParameterPresents) {
        modified.parameters.push({ key: varable.value, value: row.cells[index].value });
      }
    });

    return modified;
  });
}

function createScenarioFromOutlineExample(outline, example, location) {
  const found = example.tableBody.find((row) => row.location.line === location.line);
  const parameters = utils.getParameters(example.tableHeader, found);

  if (!found) return null;

  return {
    type: 'Scenario',
    steps: createSteps(example.tableHeader, found, outline.steps),
    parameters,
    name: outline.name,
    location: found.location,
    description: outline.description,
  };
}

function createScenarioFromOutline(outline, location) {
  const foundExample = outline.examples.find((example) => {
    const foundRow = example.tableBody.find((row) => row.location.line === location.line);

    return !!foundRow;
  });

  if (!foundExample) return null;

  return createScenarioFromOutlineExample(outline, foundExample, location);
}

function findOutlineScenario(outlines, location) {
  return outlines
    .map((child) => createScenarioFromOutline(child, location))
    .find((outline) => !!outline);
}

function findBackground(feature) {
  const background = feature.children
    ? feature.children.find((child) => child.type === 'Background')
    : null;

  return background;
}

function findFeature(documents, location) {
  return documents[location.uri].feature;
}

function findScenario(documents, location) {
  const { children } = findFeature(documents, location);
  const scenario = children.find(
    (child) => child.type === 'Scenario' && child.location.line === location.line,
  );
  if (scenario) {
    return scenario;
  }

  const outlines = children.filter((child) => child.type === 'ScenarioOutline');
  return findOutlineScenario(outlines, location);
}

function findStepDefinition(context, event) {
  return context.stepDefinitions.steps[event.index].actionLocation;
}

module.exports = {
  findBackground,
  findFeature,
  findScenario,
  findStepDefinition,
};
