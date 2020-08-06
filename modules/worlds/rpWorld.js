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
const { RP_EVENTS } = require('../constants');

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
}

module.exports = ReportPortalCucumberWorld;
