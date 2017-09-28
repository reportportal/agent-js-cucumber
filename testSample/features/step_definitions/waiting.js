'use strict'
let {defineSupportCode} = require('cucumber')

defineSupportCode(function ({Before, Given, Then, When}) {
  Given(/^I log warn and error messages$/, function (callback) {
    this.warn('This is WARN Level log')
    this.error('This is ERROR level log')
    var self = this
    self.time = new Date()
    callback()
  })

  When(/^I log number '(.*)' at the info level$/, function (number, callback) {
    this.info('This is Info Level log number is ' + number)
    callback()
  })
  Then(/^I log number '(.*)' at the debug level$/, function (number, callback) {
    this.debug('This is DEBUG Level log number is ' + number)
    callback()
  })

  Then(/^'(.*)' to '(.*)' seconds should have elapsed$/, function (minInterval, maxInterval, callback) {
    this.debug('This is Debug Level log')
    callback()
  })
  Given(/^I am on the Cucumber.js GitHub repository/, function (callback) {
    this.info('Goint to the git hub')
    browser.get('https://github.com/cucumber/cucumber-js/tree/master').then(() => {

    }).then(() => {
      this.screenshot('Test screen').then(() => {
        callback()
      })
    })
  })

  When(/^I click on '(.*)'/, function (text, callback) {
    this.info('Click a the element')
    browser.findElement({linkText: text}).then(function (element) {
      element.click().then(() => {
        callback()
      })
    }, (err) => {
      callback(err)
    })
  })

  Then(/^I should see '(.*)'/, function (text, callback) {
    var xpath = "//*[contains(text(),'" + text + "')]"
    var condition = seleniumWebdriver.until.elementLocated({xpath: xpath})
    this.info('Waiting for the elements')
    browser.wait(condition, 5000).then(() => {
      callback()
    })
  })

  /*
     * Scenario outline step definitions
     */
  Given('there are {int} cucumbers', function (number, callback) {
    this.info(number)
    callback()
  })
  When('I eat {int} cucumbers', function (number, callback) {
    this.info(number)
    callback()
  })
  Then('I should have {int} cucumbers', function (number, callback) {
    this.info(number)
    callback()
  })

  /*
     * Data table test definition
     */

  Given('the following users exist:', function (users, callback) {
    let {rawTable: [rawNames, firstRaw, secondRaw, thirdRaw]} = users
    this.info(`${rawNames} \n ${firstRaw} \n ${secondRaw} \n ${thirdRaw} `)
    callback()
  })
})
