/*
 *  Copyright 2025 EPAM Systems
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

const { PREDEFINED_LOG_LEVELS, RP_ENTITIES } = require('../constants');

class ReportPortalCucumberLoggerWorld {
  constructor({ attach, parameters }) {
    this.attach = attach;
    this.parameters = parameters;
  }

  log(message, level = PREDEFINED_LOG_LEVELS.INFO) {
    this.attach(
      JSON.stringify({
        level,
        message,
      }),
      'text/plain',
    );
  }

  info(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.INFO,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  debug(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.DEBUG,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  error(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.ERROR,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  warn(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.WARN,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  trace(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.TRACE,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  fatal(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.FATAL,
        message: logMessage,
      }),
      'text/plain',
    );
  }

  launchLog(message, level) {
    this.attach(
      JSON.stringify({
        level,
        message,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchInfo(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.INFO,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchDebug(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.DEBUG,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchError(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.ERROR,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchWarn(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.WARN,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchTrace(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.TRACE,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  launchFatal(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.FATAL,
        message: logMessage,
        entity: RP_ENTITIES.LAUNCH,
      }),
      'text/plain',
    );
  }

  scenarioLog(message, level) {
    this.attach(
      JSON.stringify({
        level,
        message,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioInfo(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.INFO,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioDebug(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.DEBUG,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioError(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.ERROR,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioWarn(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.WARN,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioTrace(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.TRACE,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  scenarioFatal(logMessage) {
    this.attach(
      JSON.stringify({
        level: PREDEFINED_LOG_LEVELS.FATAL,
        message: logMessage,
        entity: RP_ENTITIES.SCENARIO,
      }),
      'text/plain',
    );
  }

  screenshot(logMessage) {
    return this.createScreenshot(logMessage);
  }

  launchScreenshot(logMessage) {
    return this.createScreenshot(logMessage, RP_ENTITIES.LAUNCH);
  }

  scenarioScreenshot(logMessage) {
    return this.createScreenshot(logMessage, RP_ENTITIES.SCENARIO);
  }

  createScreenshot(message, entity) {
    if (!global.browser && !this.browser) {
      // eslint-disable-line no-undef
      return Promise.reject(new Error('No "browser" object defined'));
    }
    return (global.browser || this.browser)
      .takeScreenshot() // eslint-disable-line no-undef
      .then((png) =>
        this.attach(
          JSON.stringify({
            message,
            data: png,
            entity,
          }),
          'image/png',
        ),
      );
  }
}

module.exports = ReportPortalCucumberLoggerWorld;
