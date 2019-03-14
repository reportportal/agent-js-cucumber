# agent-js-cucumber
 This cucumber agent works well with cucumber versions from 3.0.0 to 4.2.1 including
## Install agent to your project dir
```cmd 
npm install agent-js-cucumber --save-dev 
```

1. Make sure that you required glue code correctly. It is important to make Cucumber see support code.
   For example:
   Let's say you have project structure like this below

  ```javascript
   my-project
    L features
        L step_definitions
                L steps.js
                    L support
                        L handlers.js
                        L timeouts.js
                        L world.js
        L package.json
```

If you use Protractor you must use protractor-cucumber-framework, bellow you could look at the config example:

```javascript
   let tempFile = tmp.fileSync();
   let reportPortalFormatter = path.resolve(process.cwd(), 'features/step_definitions/support/handlers.js');
   
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
        format: ['progress', `${reportPortalFormatter}:${tempFile.name}`],
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

```
### Note
Protractor and Cucumber have their own **timeouts** . When protractror start main process that lauches cucumber it would have different timeouts if there not the same they would wait for scripts different time. If cucumbers's timeout less then protractor's it would through wrong exeption. For example if page that has been loaded and hasn't got angular, the next error   would be thrown : ```javascript Error: function timed out after 10000 milliseconds . . . ``` . Instead of protractor's :
```javascript  Error: Error while running testForAngular: asynchronous script timeout: result was not received in 4 seconds . . .```  .
So it must be handled manually by setting cucumbers's timeout greater then protractor's is at the hooks.js. For example if you set up protractor's timeout 9000 miliseconds , so cucumber must be at least 1 second greater = 10000 miliseconds .  example could example :
```javascript

var {defineSupportCode} = require('cucumber');

defineSupportCode(function({setDefaultTimeout}) {
    setDefaultTimeout(1 * 10000);
});

```


2. Create Report Portal Configuration
   For example in ./rpConfig.json

   In example blow ${text} - is used as placeholder for your data. This data you must get from ReportPortal profile.

```javascript
    {
        token: ${rp.token},
        endpoint: ${rp.endpoint}/api/v1,
        launch: ${rp.launch},
        project: ${rp.your_project},
        mode: "DEFAULT",
        description: ${description for the launch},
        takeScreenshot: "onFailure"
    };
```

  takeScreenshot - if this option is defined then framework will take screenshot with *protractor or webdriver* API if step         has failed

3. Import Report Portal handlers into /features/step_definitions/support/handlers.js as code below
```javascript
    const {CucumberReportPortalHandler} = require('agent-js-cucumber');
    const reportportal = require('../../../rpConfig.json');
    
    function eventListeners(options) {
        let reportPortalEnabled = process.env.REPORTPORTAL;
        if (reportPortalEnabled === 'true') {
            CucumberReportPortalHandler(reportportal).call(options);
        }
    }
    
    module.exports = eventListeners;
```

4. Import World for logging into /features/step_definitions/support/world.js
 ```javascript
    let {defineSupportCode} = require('cucumber');
    let {Logger} = require('agent-js-cucumber');
    defineSupportCode(consumer => consumer.setWorldConstructor(Logger(consumer).call()));
```
If you have other world constructors it must be used with the logger as shown below
```javascript
    function CustomWorld() {
    /*
     * any driver container must be named 'browser',because reporter could be used with cucumber
     * and protractor. And protractor has global object browser which contains all web-driver methods
     */
        browser = new seleniumWebdriver.Builder()
        .forBrowser('chrome')
        .build();
}

defineSupportCode(consumer => consumer.setWorldConstructor(Logger(consumer,CustomWorld.call()).call()));
```
    It will allow you  send logs and screenshots to RP directly step definitions
    **All this logs would be attached to test data and could be viewed at the Report Portal**
    For Example:
```javascript
    Then(/^I should see my new task in the list$/, function (callback) {
        this.info("This is Info Level log");
        this.debug("This is Debug Level log");
        this.error("This is Error Level log");
        this.warn("This is Warn Level log");
        this.screenshot("This screenshot").then(() => callback());
    });
```
screenshot function return promise fulfilled after screenshot is taken and image added to attachments.
Handler will parse attachments and send corresponding log to the step item.



## Integrations
### Launch agent in single thread mode.

If you launch cucmber in single tread mode , just add agent initialization to the handler.js . Without id field.
. You can see this in the example below.
Update your configuration file as follows:
#### handlers.js
```javascript
const {CucumberReportPortalHandler} = require('../../../../modules'),
        {defineSupportCode} = require('cucumber'),
        conf = require('../../../config/rpConfig.json');
defineSupportCode(consumer => CucumberReportPortalHandler(
    Object.assign({
    takeScreenshot: 'onFailure',
}, config)).bind(consumer).call());


```

And just launch cucumber with command
```cmd
./node_modules/cucumber/bin/cucumber.js
```
or the way you like.


### Launch agents in multi thread mode.

 For launching agents in multi thread mode firstly parent launch must be created and it **ID**
 must be sent to the child launches , so they would send data to the right place, and wouldn't create new
 launch instances at the Report Portal.

 The main problem is that node.js is a single threaded platform. And for providing multi treading launch with browsers
 generate new processes  of node, which can't interact with each other, so Singelton objects or functions can't be created for synchronizing it work.
 Only primitive types could be sent as args to the new processes before launch. The way of resolving this problem is
 to create **launch file** that would generate a Parent Launch and send launch's **ID** to cucumber as argument. Then cucmber would launch cucmber-agents with the parent's ID.
 Look through example of the Launch File with native node modules ```spawn``` and ```npm ```. ```cucumber-parallel``` module was used for paralleling cucumber processes.
 Also all code sample could be viewed at the ```testSample``` folder.
 #### This is just an example. You can use any launchers as gulp or grunt to make paralizing in way you want.


1. Use a config file as in example above.

2. Create a main launch file as in example below
Parent id as global variable has been send with NPM , it could be sent in other ways.

#### cuceLaunch.js
```javascript

'use strict'
const {spawn} = require('child_process'),
    config = require('./config/rpConfig.json'),
    reportPortal = require('reportportal-client'),
    rp = new reportPortal(config);
/*
 * Parallel launch example of cucumber with webdriver
 */
const launchObject = {
    name: config.launch,
    description: !config.description ? "" : config.description,
    tags: config.tags
};

rp.startLaunch(
    Object.assign({
        start_time: rp._now(),
    }, launchObject)
).then(id => {

    let cuce = spawn('npm', ['run', 'test', `--id=${id.id}`]);

    cuce.stdout.on('data', (data) => {
        console.log(data.toString());
    });

   cuce.on('close', (code) => {
       rp.finishLaunch(id.id, {
           end_time: rp._now()
       })
           .then(result => console.log('exit with code ' + code))
           .catch(err => {
               console.log("Error occured dring finishing launch", err);
           });
   });

}).catch(err => {
        console.log('Failed to start launch due to error', config.launch, err);
    });

/*
 * Protractor launch example
 */
rp.startLaunch(
    Object.assign({
        start_time: rp._now(),
    }, launchObject)
).then(id => {
    let protractor = spawn('npm',['run','protractorTest',`--id=${id.id}`]);

    protractor.stdout.on('data', (data) =>{
        console.log(data.toString());
    });
    protractor.stderr.on('data', (data) => {
        console.log(data.toString());

    });
    protractor.on('close',(code)=> {
        rp.finishLaunch(id.id, {
            end_time: rp._now()
        })
            .then(result => console.log('exit with code ' + code))
            .catch(err => {
                console.log("Error occured dring finishing launch", err);
            });
    });

}).catch(err => {
    console.log('Failed to start launch due to error', config.launch, err);
});;

```

**Parent id as global variable has been send with NPM , it could be sent in other ways.**

```test``` script stored at package.json file
#### package.json file
```javascript
  "scripts": {
    "test": "../node_modules/cucumber-parallel/bin/cucumber-parallel ./features -r ./features/step_definitions/ -f json:./reports/report.json",
    "protractorTest": "protractor protractor.conf.js"
  }
```
3. Then create or refactor handlers.js file by adding ID  as in example below:

#### handlers.js file

```javascript
const {CucumberReportPortalHandler} = require('../../../../modules'),
         {defineSupportCode} = require('cucumber'),
         conf = require('../../../config/rpConfig.json');
 defineSupportCode(consumer => CucumberReportPortalHandler(
     Object.assign({
     id: process.env.npm_config_id,
     takeScreenshot: 'onFailure',
 }, config)).bind(consumer).call());
```

```process.env.npm_config_id``` is global varuable that has been sent with npm

5. Run **cuceLaunch.js** file with command ```node cuceLaunch.js```

### Run test sample .
For running test sample clone cucumber-js-agent .
At the working directory run
```npm i --dev```  - that would install all dev dependencies.

```npm run test``` - that would run all tests in parallel mode

```npm run protractor``` - that would run tests with parallel mode

```npm run testSingle``` - that would run test in one tread mode .



# Copyright Notice
Licensed under the [GPLv3](https://www.gnu.org/licenses/quick-guide-gplv3.html)
license (see the LICENSE.txt file).
