# @reportportal/agent-js-cucumber

Agent to integrate CucumberJS with ReportPortal.
* More about [CucumberJS](https://cucumber.io/docs/installation/javascript/)
* More about [ReportPortal](http://reportportal.io/)

This agent works with Cucumber versions from 7.x to 11.x.
See [release notes](https://github.com/reportportal/agent-js-cucumber/releases) for the detailed versions description.

## Install the agent to your project dir

```cmd
npm install --save-dev @reportportal/agent-js-cucumber
```

1. Make sure that you required glue code correctly. It is important to make Cucumber see support code.
   For example:
   Let's say you have project structure like this below

    ```
     my-project
      L features
          L step_definitions
              L steps.js
              L support
                  L hooks.js
                  L world.js
      L package.json
    ```

    #### Note
    
    Protractor and Cucumber have their own **timeouts** .
    When protractor start main process that launches cucumber it would have different timeouts if they are not the same they would wait for scripts different time.
    If cucumber's timeout less than protractor's it would through wrong exception.
    For example if page that has been loaded and hasn't got angular, the next error would be thrown : `Error: function timed out after 10000 milliseconds . . .` . Instead of protractor's :
    `Error: Error while running testForAngular: asynchronous script timeout: result was not received in 4 seconds . . .` .
    So it must be handled manually by setting cucumber's timeout greater than protractor's is at the hooks.js. For example if you set up protractor's timeout 9000 miliseconds , so cucumber must be at least 1 second greater = 10000 miliseconds. Example :
    
    ```javascript
    var { setDefaultTimeout } = require('@cucumber/cucumber');
    
    setDefaultTimeout(10000);
    ```

2. Create Report Portal configuration file
   For example `./rpConfig.json`

    ```json
    {
      "apiKey": "reportportalApiKey",
      "endpoint": "https://your.reportportal.server/api/v1",
      "launch": "Your launch name",
      "project": "Your reportportal project name",
      "description": "Awesome launch description.",
      "attributes": [
        {
          "key": "launchAttributeKey",
          "value": "launchAttributeValue"
        }
      ],
      "takeScreenshot": "onFailure"
    }
    ```

The full list of available options presented below.

| Option                  | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|-------------------------|------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey                  | Required   |           | User's reportportal token from which you want to send requests. It can be found on the profile page of this user.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| endpoint                | Required   |           | URL of your server. For example 'https://server:8080/api/v1'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| launch                  | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| project                 | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| attributes              | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| description             | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| rerun                   | Optional   | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| rerunOf                 | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name                                                                                                                                                                                                                                                                                                                                                                                                                                |
| mode                    | Optional   | 'DEFAULT' | Results will be submitted to Launches page <br/> *'DEBUG'* - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| debug                   | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| launchId                | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN_PROGRESS' status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                                                                                                                                                                                |                            
| restClientConfig        | Optional   | Not set   | `axios` like http client [config](https://github.com/axios/axios#request-config). May contain `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, and other client options e.g. `proxy`, [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). For debugging and displaying logs the `debug: true` option can be used. <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| headers                 | Optional   | {}        | The object with custom headers for internal http client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| launchUuidPrint         | Optional   | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| launchUuidPrintOutput   | Optional   | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR', 'FILE', 'ENVIRONMENT'. Works only if `launchUuidPrint` set to `true`. File format: `rp-launch-uuid-${launch_uuid}.tmp`. Env variable: `RP_LAUNCH_UUID`, note that the env variable is only available in the reporter process (it cannot be obtained from tests).                                                                                                                                                                                                               |
| skippedIssue            | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                                                                                                                                                                          |
| takeScreenshot          | Optional   | Not set   | Possible values: *onFailure*. If this option is defined then framework will take screenshot with protractor or webdriver API if step has failed.                                                                                                                                                                                                                                                                                                                                                                                                 |
| scenarioBasedStatistics | Optional   | false     | While true, the Gherkin Scenarios considered as entity with statistics. In this case Cucumber steps will be reported to the log level as nested steps.                                                                                                                                                                                                                                                                                                                                                                                           |
| token                   | Deprecated | Not set   | Use `apiKey` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

3. Create Report Portal formatter in a new js file, for example `reportPortalFormatter.js`:

    ```javascript
    const { createRPFormatterClass } = require('@reportportal/agent-js-cucumber');
    const config = require('./rpConfig.json');
    
    module.exports = createRPFormatterClass(config);
    ```

4. Import RPWorld (provides API for logging and data attaching) into /features/step_definitions/support/world.js
    
    ```javascript
    let { setWorldConstructor } = require('@cucumber/cucumber');
    let { RPWorld } = require('@reportportal/agent-js-cucumber');
    setWorldConstructor(RPWorld);
    ```
    
    If you have other world constructors it must be used with the RPWorld as shown below
    
    ```javascript
    class CustomWorld extends RPWorld {
      constructor(...args) {
        super(...args);
    
        /*
         * any driver container must be named 'browser', because reporter could be used with cucumber
         * and protractor. And protractor has global object browser which contains all web-driver methods
         */
        global.browser = new seleniumWebdriver.Builder().forBrowser('chrome').build();
      }
    }
    
    setWorldConstructor(CustomWorld);
    ```
    
    It will allow you send logs and screenshots to RP directly from step definitions.
    **All this logs would be attached to test data and could be viewed at the Report Portal**.<br/>
    Also you will be able to specify additional info for test items (e.g. description, attributes, testCaseId, status).
    See [API](#api) section for more information.

5. Run cucumber-js

    `cucumber-js -f ./reportPortalFormatter.js`
    
    More info in the [examples](https://github.com/reportportal/examples-js/tree/master/example-cucumber) repository.

## Step reporting configuration

By default, this agent reports the following structure:

- feature - SUITE
- scenario - TEST
- step - STEP

You may change this behavior to report steps to the log level by enabling scenario-based reporting:

- feature - TEST
- scenario - STEP
- step - log item (nested step)

To report your steps as logs without creating statistics for every step, you need to pass an additional parameter to the agent config: `"scenarioBasedStatistics": true`

```json
{
  "scenarioBasedStatistics": true
}
```

## API

### Attachments

Attachments are being reported as logs. You can either just attach a file using cucumber's `this.attach` or specify log level and message:

```javascript
this.attach(
  JSON.stringify({
    message: `Attachment with ${type}`,
    level: 'INFO',
    data: data.toString('base64'),
  }),
  type,
);
```
To send attachment to the launch/scenario just specify `entity: 'launch'` or `entity: 'scenario'` property accordingly.

Also `this.screenshot`, `this.scenarioScreenshot` and `this.launchScreenshot` methods can be used to take screenshots.

```javascript
Then(/^I should see my new task in the list$/, function(callback) {
  this.screenshot('This screenshot')
    .then(() => callback())
    .catch((err) => callback(err));
  this.scenarioScreenshot('This is screenshot for scenario')
    .then(() => callback())
    .catch((err) => callback(err));
  this.launchScreenshot('This is screenshot for launch')
    .then(() => callback())
    .catch((err) => callback(err));
});
```

`screenshot`/`scenarioScreenshot`/`launchScreenshot` function return promise fulfilled after `screenshot` is taken and image added to attachments.
Handler will parse attachments and send corresponding log to the step item.

### Logs

To report logs to the **items** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.info('This is Info Level log');
  this.debug('This is Debug Level log');
  this.error('This is Error Level log');
  this.warn('This is Warn Level log');
  this.trace('This is Trace Level log');
  this.fatal('This is Fatal Level log');
});
```

To report logs to the **scenario** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.scenarioInfo('This is Info Level log');
  this.scenarioDebug('This is Debug Level log');
  this.scenarioError('This is Error Level log');
  this.scenarioWarn('This is Warn Level log');
  this.scenarioTrace('This is Trace Level log');
  this.scenarioFatal('This is Fatal Level log');
});
```

To report logs to the **launch** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.launchInfo('This is Info Level log');
  this.launchDebug('This is Debug Level log');
  this.launchError('This is Error Level log');
  this.launchWarn('This is Warn Level log');
  this.launchTrace('This is Trace Level log');
  this.launchFatal('This is Fatal Level log');
});
```

### Attributes

Attributes for features and scenarios are parsed from @tags as `@key:value` pair.

To add attributes to the **step items** you can use the next method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addAttributes([{ key: 'agent', value: 'cucumber' }]);
});
```

To add attributes to the **scenario** you can use the next method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addScenarioAttributes([{ key: 'agent', value: 'cucumber' }]);
});
```

The attributes will be concatenated.

### Description

Description for features and scenarios are parsed from their definition.

To add description to the **items** you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addDescription('Test item description.');
});
```

To add description to the **scenario** you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addScenarioDescription('Scenario description.');
});
```

The description will be concatenated.

### TestCaseId

To set test case id to the **items** you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setTestCaseId('itemTestCaseId');
});
```

To set test case id to the **scenario** you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setScenarioTestCaseId('scenarioTestCaseId');
});
```

### Statuses

The user can set the status of the item/launch directly depending on some conditions or behavior.
It will take precedence over the actual completed status.

To set status to the **item** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setStatusPassed();
  this.setStatusFailed();
  this.setStatusSkipped();
  this.setStatusStopped();
  this.setStatusInterrupted();
  this.setStatusCancelled();
});
```

To set status to the **scenario** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setScenarioStatusPassed();
  this.setScenarioStatusFailed();
  this.setScenarioStatusSkipped();
  this.setScenarioStatusStopped();
  this.setScenarioStatusInterrupted();
  this.setScenarioStatusCancelled();
  this.setScenarioStatusInfo();
  this.setScenarioStatusWarn();
});
```

To set status to the **launch** you can use the next methods:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setLaunchStatusPassed();
  this.setLaunchStatusFailed();
  this.setLaunchStatusSkipped();
  this.setLaunchStatusStopped();
  this.setLaunchStatusInterrupted();
  this.setLaunchStatusCancelled();
});
```

# Copyright Notice

Licensed under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.html)
license (see the LICENSE.txt file).
