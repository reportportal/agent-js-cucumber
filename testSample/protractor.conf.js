require('chromedriver');
exports.config = {
    framework: 'custom',
    getPageTimeout: 4000,
    allScriptsTimeout: 4000,
    params: {
        defaultTimeOut: 4000
    },
    seleniumAddress: 'http://localhost:4444/wd/hub',
    frameworkPath: require.resolve('protractor-cucumber-framework'),
    cucumberOpts: {
        require: './protractor/features/step_definitions/**/*.js',
        tags: false,
        format: 'pretty',
        profile: false,
        'no-source': true
    },
    multiCapabilities: [
    {
        name: 'normal',
        browserName: 'chrome',
        shardTestFiles: true,
        maxInstances: 2,
        chromeOptions: {
            args: ['--window-size=1024,768', '--disable-infobars']
        }
    }
],

    specs: ['./protractor/features/*.feature']
}
