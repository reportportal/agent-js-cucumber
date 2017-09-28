module.exports = () => {
  return function (consumer) {
    return function ProtractorCucumberWorld (consumer) {
      this.attach = consumer.attach
      this.parameters = consumer.parameters
      this.info = function (logMessage) {
        this.attach(JSON.stringify({
          level: 'INFO',
          message: logMessage
        }), 'text/plain')
      }
      this.debug = function (logMessage) {
        this.attach(JSON.stringify({
          level: 'DEBUG',
          message: logMessage
        }), 'text/plain')
      }
      this.warn = function (logMessage) {
        this.attach(JSON.stringify({
          level: 'WARN',
          message: logMessage
        }), 'text/plain')
      }
      this.error = function (logMessage) {
        this.attach(JSON.stringify({
          level: 'ERROR',
          message: logMessage
        }), 'text/plain')
      }
      this.screenshot = function (logMessage) {
        let _self = this
        if (browser) {
          return browser.takeScreenshot()
            .then(png =>
              _self.attach(JSON.stringify({
                message: logMessage,
                data: png
              }), 'image/png')
            )
        } else {

        }
      }
    }
  }
}
