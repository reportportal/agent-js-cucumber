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

const STATUSES = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  STOPPED: 'stopped',
  INTERRUPTED: 'interrupted',
  CANCELLED: 'cancelled',
  INFO: 'info',
  WARN: 'warn',
  STARTED: 'started',
  PENDING: 'pending',
  NOT_IMPLEMENTED: 'not_implemented',
  UNDEFINED: 'undefined',
  NOT_FOUND: 'not_found',
  AMBIGUOUS: 'ambiguous',
};

const LOG_LEVELS = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE',
  FATAL: 'FATAL',
  WARN: 'WARN',
};

const RP_ENTITIES = {
  LAUNCH: 'LAUNCH',
  SCENARIO: 'SCENARIO',
};

const CUCUMBER_EVENTS = {
  GHERKIN_DOCUMENT: 'gherkin-document',
  PICKLE_ACCEPTED: 'pickle-accepted',
  TEST_CASE_PREPARED: 'test-case-prepared',
  TEST_CASE_STARTED: 'test-case-started',
  TEST_CASE_FINISHED: 'test-case-finished',
  TEST_STEP_STARTED: 'test-step-started',
  TEST_STEP_FINISHED: 'test-step-finished',
  TEST_STEP_ATTACHMENT: 'test-step-attachment',
  TEST_RUN_FINISHED: 'test-run-finished',
};

const CUCUMBER_MESSAGES = {
  GHERKIN_DOCUMENT: 'gherkinDocument',
  HOOK: 'hook',
  PICKLE: 'pickle',
  TEST_RUN_STARTED: 'testRunStarted',
  TEST_CASE: 'testCase',
  TEST_CASE_STARTED: 'testCaseStarted',
  TEST_CASE_FINISHED: 'testCaseFinished',
  TEST_STEP_STARTED: 'testStepStarted',
  ATTACHMENT: 'attachment',
  TEST_STEP_FINISHED: 'testStepFinished',
  TEST_RUN_FINISHED: 'testRunFinished',
};

const TEST_ITEM_TYPES = {
  SUITE: 'SUITE',
  STEP: 'STEP',
  TEST: 'TEST',
  BEFORE_TEST: 'BEFORE_TEST',
  AFTER_TEST: 'AFTER_TEST',
};

const RP_EVENTS = {
  STEP_TEST_CASE_ID: 'rp/step/testCaseId',
  STEP_ATTRIBUTES: 'rp/step/attributes',
  STEP_DESCRIPTION: 'rp/step/description',
  STEP_STATUS: 'rp/step/status',
  SCENARIO_TEST_CASE_ID: 'rp/scenario/testCaseId',
  SCENARIO_ATTRIBUTES: 'rp/scenario/attributes',
  SCENARIO_DESCRIPTION: 'rp/scenario/description',
  SCENARIO_STATUS: 'rp/scenario/status',
  LAUNCH_STATUS: 'rp/launch/status',
};

const TEST_STEP_FINISHED_RP_MESSAGES = {
  PENDING: "This step is marked as 'pending'",
  UNDEFINED: 'There is no step definition found. Please verify and implement it.',
  AMBIGUOUS: 'There are more than one step implementation. Please verify and reimplement it.',
};

module.exports = {
  RP_ENTITIES,
  STATUSES,
  LOG_LEVELS,
  CUCUMBER_EVENTS,
  RP_EVENTS,
  CUCUMBER_MESSAGES,
  TEST_STEP_FINISHED_RP_MESSAGES,
  TEST_ITEM_TYPES,
};
