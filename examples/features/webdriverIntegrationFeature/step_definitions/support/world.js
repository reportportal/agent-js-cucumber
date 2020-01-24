require('chromedriver');
const cucumber = require('cucumber');
const { Builder } = require('selenium-webdriver');
const { Logger } = require('../../../../../modules');

class CustomLogger extends Logger {
  constructor(...args) {
    super(...args);

    global.browser = new Builder().forBrowser('chrome').build();
  }
}

cucumber.setWorldConstructor(CustomLogger);
