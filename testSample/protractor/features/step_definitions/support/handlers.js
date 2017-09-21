const {CucumberReportPortalHandler} = require('../../../../../modules')
const {defineSupportCode} = require('cucumber')
const config = require('../../../../config/rpConfig.json')
defineSupportCode(consumer => CucumberReportPortalHandler(
  Object.assign({
    id: process.env.npm_config_id,
    takeScreenshot: 'onFailure'
  }, config)).bind(consumer).call())
