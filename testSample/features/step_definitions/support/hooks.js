const {defineSupportCode} = require('cucumber')

defineSupportCode(function ({setDefaultTimeout}) {
  setDefaultTimeout(1 * 20000)
})
