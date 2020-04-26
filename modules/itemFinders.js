function createSteps(header, row, steps) {
  return steps.map((step) => {
    const modified = { ...step };

    header.cells.forEach((varable, index) => {
      modified.text = modified.text.replace(`<${varable.value}>`, row.cells[index].value);
    });

    return modified;
  });
}

function createScenarioFromOutlineExample(outline, example, location) {
  const found = example.tableBody.find((row) => row.location.line === location.line);

  if (!found) return null;

  return {
    type: 'Scenario',
    steps: createSteps(example.tableHeader, found, outline.steps),
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
  const { children } = findFeature(location);
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
