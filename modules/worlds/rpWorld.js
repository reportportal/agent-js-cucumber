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

const LoggerWorld = require('./loggerWorld');
const { RP_EVENTS, STATUSES } = require('../constants');

class ReportPortalCucumberWorld extends LoggerWorld {
  setTestCaseId(testCaseId) {
    this.attach(
      JSON.stringify({
        testCaseId,
      }),
      RP_EVENTS.STEP_TEST_CASE_ID,
    );
  }

  addAttributes(attributes) {
    this.attach(
      JSON.stringify({
        attributes,
      }),
      RP_EVENTS.STEP_ATTRIBUTES,
    );
  }

  addDescription(description) {
    this.attach(
      JSON.stringify({
        description,
      }),
      RP_EVENTS.STEP_DESCRIPTION,
    );
  }

  setStatusPassed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.PASSED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusFailed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.FAILED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusSkipped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.SKIPPED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusStopped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.STOPPED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusInterrupted() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INTERRUPTED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusCancelled() {
    this.attach(
      JSON.stringify({
        status: STATUSES.CANCELLED,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusInfo() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INFO,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setStatusWarn() {
    this.attach(
      JSON.stringify({
        status: STATUSES.WARN,
      }),
      RP_EVENTS.STEP_STATUS,
    );
  }

  setLaunchStatusPassed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.PASSED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusFailed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.FAILED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusSkipped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.SKIPPED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusStopped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.STOPPED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusInterrupted() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INTERRUPTED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusCancelled() {
    this.attach(
      JSON.stringify({
        status: STATUSES.CANCELLED,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusInfo() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INFO,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setLaunchStatusWarn() {
    this.attach(
      JSON.stringify({
        status: STATUSES.WARN,
      }),
      RP_EVENTS.LAUNCH_STATUS,
    );
  }

  setScenarioTestCaseId(testCaseId) {
    this.attach(
      JSON.stringify({
        testCaseId,
      }),
      RP_EVENTS.SCENARIO_TEST_CASE_ID,
    );
  }

  addScenarioAttributes(attributes) {
    this.attach(
      JSON.stringify({
        attributes,
      }),
      RP_EVENTS.SCENARIO_ATTRIBUTES,
    );
  }

  addScenarioDescription(description) {
    this.attach(
      JSON.stringify({
        description,
      }),
      RP_EVENTS.SCENARIO_DESCRIPTION,
    );
  }

  setScenarioStatusPassed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.PASSED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusFailed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.FAILED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusSkipped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.SKIPPED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusStopped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.STOPPED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusInterrupted() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INTERRUPTED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusCancelled() {
    this.attach(
      JSON.stringify({
        status: STATUSES.CANCELLED,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusInfo() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INFO,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }

  setScenarioStatusWarn() {
    this.attach(
      JSON.stringify({
        status: STATUSES.WARN,
      }),
      RP_EVENTS.SCENARIO_STATUS,
    );
  }
}

module.exports = ReportPortalCucumberWorld;
