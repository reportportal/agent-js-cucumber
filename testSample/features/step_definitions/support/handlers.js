const {CucumberReportPortalHandler} = require('../../../../modules'),
        {defineSupportCode} = require('cucumber'),
        conf = require('../../../config/rpConfig.json');
defineSupportCode(consumer => CucumberReportPortalHandler(
    Object.assign({
    id: process.env.npm_config_id,
    takeScreenshot: 'onFailure',
}, config)).bind(consumer).call());
