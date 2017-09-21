require('chromedriver')
/**
 * Such kind of  declaration put var to the cucumbers global,
 * so it could be called everywhere
 */

seleniumWebdriver = require('selenium-webdriver')
const {defineSupportCode} = require('cucumber'),
  {Logger} = require('../../../../modules')

function CustomWorld () {
  /*
     * any driver container must be named 'browser' or add this reference ,because reporter could be used with cucumber
     * and protractor. And protractor has global object browser which contains all web-driver methods
     */
  browser = new seleniumWebdriver.Builder()
    .forBrowser('chrome')
    .build()
}

defineSupportCode(consumer => consumer.setWorldConstructor(Logger(consumer, CustomWorld.call()).call()))
