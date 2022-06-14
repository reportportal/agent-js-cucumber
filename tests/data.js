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

const launchTempId = 'tempId';
const uri = 'features/statuses/statuses.feature';
const scenarioId = '1957ea93-e4de-4895-86e8-acb857b5b069';
const feature = {
  keyword: 'Feature',
  name: 'statuses',
  description: '',
  children: [{ scenario: { id: scenarioId, name: 'scenario name' } }],
};
const featureWithRule = {
  keyword: 'Feature',
  name: 'statuses',
  description: '',
  children: [{ rule: { children: [{ scenario: { id: scenarioId, name: 'scenario name' } }] } }],
};
const gherkinDocument = {
  uri,
  feature,
};
const gherkinDocumentWithRule = {
  uri,
  feature: featureWithRule,
};
const stepId = '24cd555d-691e-4901-b24d-6af48d37b732';
const step = {
  id: stepId,
  text: 'I put "true"',
  argument: undefined,
  astNodeIds: [],
};
const pickleId = 'c544ae8c-f080-41be-a612-f3000ac46565';
const pickle = {
  id: pickleId,
  uri: 'features/statuses/statuses.feature',
  astNodeIds: ['1957ea93-e4de-4895-86e8-acb857b5b069'],
  name: 'Given and expected value are equal',
  steps: [step],
};
const testCaseId = '16c505eb-433e-496a-82d8-7799f5dd99ce';
const testStepId = '635a880a-73c7-440d-9c28-eee5d0353339';
const testCase = {
  pickleId,
  id: testCaseId,
  testSteps: [
    {
      id: testStepId,
      pickleStepId: stepId,
    },
  ],
};
const testCaseStartedId = '57e2a70f-a001-4774-97fa-1e6d5fdb293b';
const testCaseStarted = {
  testCaseId,
  id: testCaseStartedId,
  timestamp: { seconds: 1654094464, nanos: 288000000 },
};
const testStepStarted = {
  testCaseStartedId,
  testStepId,
  timestamp: { seconds: 1655135466, nanos: 216000000 },
};
const testStepFinished = {
  testCaseStartedId,
  testStepId,
  testStepResult: {
    duration: { seconds: 0, nanos: 1677291 },
    status: 'FAILED',
    message: 'error message',
  },
  timestamp: { seconds: 1655135607, nanos: 153000000 },
};
const testCaseFinished = {
  testCaseStartedId,
  timestamp: { seconds: 1655136254, nanos: 966000000 },
  willBeRetried: false,
};

const featureTempId = 'featureTempId';
const scenarioTempId = 'scenarioTempId';
const stepTempId = 'stepTempId';
const ruleTempId = 'ruleTempId';

module.exports = {
  launchTempId,
  gherkinDocument,
  gherkinDocumentWithRule,
  scenarioId,
  feature,
  featureWithRule,
  pickleId,
  uri,
  pickle,
  testCase,
  testCaseId,
  testCaseStarted,
  testCaseStartedId,
  testStepId,
  testStepStarted,
  testStepFinished,
  testCaseFinished,
  step,
  featureTempId,
  scenarioTempId,
  stepTempId,
  ruleTempId,
};
