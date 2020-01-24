class ProtractorCucumberWorld {
  constructor({ attach, parameters }) {
    this.attach = attach;
    this.parameters = parameters;
  }

  info(logMessage) {
    this.attach(
      JSON.stringify({
        level: 'INFO',
        message: logMessage,
      }),
      'text/plain',
    );
  }

  debug(logMessage) {
    this.attach(
      JSON.stringify({
        level: 'DEBUG',
        message: logMessage,
      }),
      'text/plain',
    );
  }

  error(logMessage) {
    this.attach(
      JSON.stringify({
        level: 'ERROR',
        message: logMessage,
      }),
      'text/plain',
    );
  }

  screenshot(logMessage) {
    if (!global.browser && !this.browser) {
      // eslint-disable-line no-undef
      return Promise.reject(new Error('No "browser" object defined'));
    }
    return (global.browser || this.browser)
      .takeScreenshot() // eslint-disable-line no-undef
      .then((png) =>
        this.attach(
          JSON.stringify({
            message: logMessage,
            data: png,
          }),
          'image/png',
        ),
      );
  }
}

module.exports = ProtractorCucumberWorld;
