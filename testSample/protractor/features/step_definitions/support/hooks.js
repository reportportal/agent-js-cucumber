var {defineSupportCode} = require('cucumber')

defineSupportCode(function ({setDefaultTimeout}) {
  setDefaultTimeout(1 * 6000)
})
