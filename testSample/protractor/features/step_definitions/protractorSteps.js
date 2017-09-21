'use strict'
var {defineSupportCode} = require('cucumber')

defineSupportCode(function ({Before, Given, Then, When}) {
  Given(/^I go to the page with url : '(.*)'$/, function (url, callback) {
    this.info('loading  page with url ' + url)
    browser.get(url).then(() => callback()).catch((err) => {
      console.log('error =========')
      callback(err)
    })
  })
  Then(/^I send text to the toDo list : '(.*)'$/, function (text, callback) {
    this.info('sent text ' + text)
    element(by.model('todoList.todoText')).sendKeys(text).then(() => {
    }).then(() => {
      element(by.css('[value="add"]')).click().then(() => {
        callback()
      })
    }).catch(err => {
      callback(err)
    })
  })

  Then('It must throws noSuchElement error', function (callback) {
    element(by.model('noElement')).sendKeys('Hey').then(() => {
      callback()
    }).catch(err => {
      callback(err)
    })
  })
})
