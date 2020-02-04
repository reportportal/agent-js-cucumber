require('chromedriver');
const cucumber = require('cucumber');
const { Builder } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const { Logger } = require('../../../../../modules');

class CustomLogger extends Logger {
  constructor(...args) {
    super(...args);

    global.browser = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new Options().headless())
      .build();
  }
}

cucumber.setWorldConstructor(CustomLogger);
