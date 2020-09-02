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
const { RP_EVENTS, STATUSES, RP_ENTITY_LAUNCH } = require('../constants');

class ReportPortalCucumberWorld extends LoggerWorld {
  setTestCaseId(testCaseId) {
    this.attach(
      JSON.stringify({
        testCaseId,
      }),
      RP_EVENTS.TEST_CASE_ID,
    );
  }

  addAttributes(attributes) {
    this.attach(
      JSON.stringify({
        attributes,
      }),
      RP_EVENTS.ATTRIBUTES,
    );
  }

  addDescription(description) {
    this.attach(
      JSON.stringify({
        description,
      }),
      RP_EVENTS.DESCRIPTION,
    );
  }

  setStatusPassed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.PASSED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusFailed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.FAILED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusSkipped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.SKIPPED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusStopped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.STOPPED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusInterrupted() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INTERRUPTED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusCancelled() {
    this.attach(
      JSON.stringify({
        status: STATUSES.CANCELLED,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusInfo() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INFO,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setStatusWarn() {
    this.attach(
      JSON.stringify({
        status: STATUSES.WARN,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusPassed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.PASSED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusFailed() {
    this.attach(
      JSON.stringify({
        status: STATUSES.FAILED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusSkipped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.SKIPPED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusStopped() {
    this.attach(
      JSON.stringify({
        status: STATUSES.STOPPED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusInterrupted() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INTERRUPTED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusCancelled() {
    this.attach(
      JSON.stringify({
        status: STATUSES.CANCELLED,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusInfo() {
    this.attach(
      JSON.stringify({
        status: STATUSES.INFO,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }

  setLaunchStatusWarn() {
    this.attach(
      JSON.stringify({
        status: STATUSES.WARN,
        entity: RP_ENTITY_LAUNCH,
      }),
      RP_EVENTS.STATUS,
    );
  }
}

module.exports = ReportPortalCucumberWorld;
