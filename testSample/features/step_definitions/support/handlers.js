'use strict';

const {CucumberReportPortalHandler} = require('../../../../modules');
const config = require('../../../config/rpConfig.json');

function eventListeners(options) {
    const reportportal = Object.assign({
    id: process.env.npm_config_id,
    takeScreenshot: 'onFailure'
    }, config);
    CucumberReportPortalHandler(reportportal).call(options);
}

module.exports = eventListeners;
