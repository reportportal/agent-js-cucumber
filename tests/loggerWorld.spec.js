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

const ReportPortalCucumberLoggerWorld = require('../modules/worlds/loggerWorld');
const { LOG_LEVELS, RP_ENTITIES } = require('../modules/constants');

describe('ReportPortalCucumberLoggerWorld', () => {
  let loggerWorld;
  let attachSpy;

  beforeEach(() => {
    attachSpy = jest.fn();
    loggerWorld = new ReportPortalCucumberLoggerWorld({
      attach: attachSpy,
      parameters: {},
    });
  });

  describe('info', () => {
    it('should attach log with INFO level', () => {
      const message = 'Test info message';
      loggerWorld.info(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.INFO,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('debug', () => {
    it('should attach log with DEBUG level', () => {
      const message = 'Test debug message';
      loggerWorld.debug(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.DEBUG,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('error', () => {
    it('should attach log with ERROR level', () => {
      const message = 'Test error message';
      loggerWorld.error(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.ERROR,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('warn', () => {
    it('should attach log with WARN level', () => {
      const message = 'Test warn message';
      loggerWorld.warn(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.WARN,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('trace', () => {
    it('should attach log with TRACE level', () => {
      const message = 'Test trace message';
      loggerWorld.trace(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.TRACE,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('fatal', () => {
    it('should attach log with FATAL level', () => {
      const message = 'Test fatal message';
      loggerWorld.fatal(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.FATAL,
          message,
        }),
        'text/plain',
      );
    });
  });

  describe('launchInfo', () => {
    it('should attach log with INFO level and LAUNCH entity', () => {
      const message = 'Test launch info message';
      loggerWorld.launchInfo(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.INFO,
          message,
          entity: RP_ENTITIES.LAUNCH,
        }),
        'text/plain',
      );
    });
  });

  describe('scenarioInfo', () => {
    it('should attach log with INFO level and SCENARIO entity', () => {
      const message = 'Test scenario info message';
      loggerWorld.scenarioInfo(message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: LOG_LEVELS.INFO,
          message,
          entity: RP_ENTITIES.SCENARIO,
        }),
        'text/plain',
      );
    });
  });

  describe('custom log', () => {
    it('should attach log with specified level and message', () => {
      const message = 'Test custom message';
      const level = LOG_LEVELS.INFO;
      loggerWorld.log(level, message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level,
          message,
        }),
        'text/plain',
      );
    });

    it('should attach log with ERROR level', () => {
      const message = 'Test error message';
      const level = LOG_LEVELS.ERROR;
      loggerWorld.log(level, message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level,
          message,
        }),
        'text/plain',
      );
    });

    it('should attach log with DEBUG level', () => {
      const message = 'Test debug message';
      const level = LOG_LEVELS.DEBUG;
      loggerWorld.log(level, message);

      expect(attachSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level,
          message,
        }),
        'text/plain',
      );
    });

    it('should accept all valid log levels', () => {
      Object.keys(LOG_LEVELS).forEach((levelKey) => {
        attachSpy.mockClear();
        const message = `Test message for ${levelKey}`;
        loggerWorld.log(levelKey, message);

        expect(attachSpy).toHaveBeenCalledWith(
          JSON.stringify({
            level: levelKey,
            message,
          }),
          'text/plain',
        );
      });
    });
  });
});

