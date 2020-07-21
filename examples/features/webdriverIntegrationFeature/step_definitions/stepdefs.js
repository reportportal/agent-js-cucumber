const { Given, When, Then } = require('cucumber');
const { until } = require('selenium-webdriver');

Given(/^I am on the Cucumber.js GitHub repository/, function(callback) {
  this.info('Going to the GitHub');
  global.browser
    .get('https://github.com/cucumber/cucumber-js/tree/master')
    .then(() => {
      this.screenshot('Test screen')
        .then(() => {
          callback();
        })
        .catch((err) => callback(err));
      this.launchScreenshot('Test screen for launch')
        .then(() => {
          callback();
        })
        .catch((err) => callback(err));
    })
    .catch((err) => callback(err));
});

When(/^I click on '(.*)'/, function(text, callback) {
  this.info('Click at the element');
  global.browser.findElement({ linkText: text }).then(
    (element) => {
      element.click().then(() => {
        callback();
      });
    },
    (err) => {
      callback(err);
    },
  );
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
