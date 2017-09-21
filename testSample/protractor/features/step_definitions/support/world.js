require('chromedriver')

const {defineSupportCode} = require('cucumber')
const {Logger} = require('../../../../../modules')

defineSupportCode(consumer => consumer.setWorldConstructor(Logger(consumer).call()))
