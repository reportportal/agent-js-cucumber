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

const ReportPortalClient = require('@reportportal/client-javascript');
const utils = require('./utils');
const pjson = require('../package.json');

const createRPFormatterClass = (config) => {
  let Formatter;
  let module;
  try {
    // eslint-disable-next-line global-require
    Formatter = require('@cucumber/cucumber').Formatter;
    // eslint-disable-next-line global-require
    module = require('./api/current');
  } catch (e) {
    // eslint-disable-next-line global-require
    Formatter = require('cucumber').Formatter;
    // eslint-disable-next-line global-require
    module = require('./api/deprecated');
  }

  return class CucumberReportPortalFormatter extends Formatter {
    constructor(options) {
      super(options);
      this.options = options;
      this.config = config;
      this.reportportal = new ReportPortalClient(config, {
        name: pjson.name,
        version: pjson.version,
      });
      const { rerun, rerunOf } = options.parsedArgvOptions || {};
      this.isRerun = rerun || config.rerun;
      this.rerunOf = rerunOf || config.rerunOf;
      this.isScenarioBasedStatistics =
        typeof this.config.scenarioBasedStatistics === 'boolean'
          ? this.config.scenarioBasedStatistics
          : false;

      utils.bindToClass(module, this);

      this.init();
    }
  };
};

module.exports = { createRPFormatterClass };
