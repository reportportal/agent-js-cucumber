const { Given, When, Then } = require('cucumber');
const { until } = require('selenium-webdriver');

Given(/^I am on the Cucumber.js GitHub repository/, function(callback) {
  this.addDescription('This test should load GitHub cucumber-js page and take the screenshot!');
  this.info('Going to the GitHub');
  global.browser
    .get('https://github.com/cucumber/cucumber-js/tree/master')
    .then(() => {
      this.setTestCaseId('itemTestCaseId');
      return this.screenshot('Test screen');
    })
    .then(() => {
      this.addDescription('Screenshot taken!');
      callback();
    })
    .catch((err) => callback(err));
});

When(/^I click on '(.*)'/, function(text, callback) {
  this.info('Click at the element');
  this.addAttributes([{ key: 'browser', value: 'chrome' }]);
  global.browser
    .findElement({ linkText: text })
    .then((element) => {
      return element.click();
    })
    .then(() => {
      return this.launchScreenshot('Test screen for launch');
    })
    .then(() => {
      this.addDescription('Screenshot for launch taken!');
      callback();
    })
    .catch((err) => callback(err));
});

Then(/^I should see '(.*)'/, function(text, callback) {
  const xpath = `//*[contains(text(),'${text}')]`;
  const condition = until.elementLocated({ xpath });
  this.info('Waiting for the elements');
  global.browser
    .wait(condition, 5000)
    .then(() => {
      callback();
    })
    .catch((err) => callback(err));
});
