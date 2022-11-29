## THIS IS DOCUMENTATION FOR DEPRECATED VERSION CUCUMBER FRAMEWORK<br> PLEASE USE CUCUMBER VERSION FROM 7 OR HIGHER

# agent-js-cucumber

Agent for integration CucumberJS with ReportPortal.
* More about [CucumberJS](https://cucumber.io/docs/installation/javascript/)
* More about [ReportPortal](http://reportportal.io/)

This agent works well with cucumber versions from 4.x to 6.x inclusive.

## Install agent to your project dir

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
    When protractror start main process that lauches cucumber it would have different timeouts if there not the same they would wait for scripts different time.
    If cucumbers's timeout less then protractor's it would through wrong exeption.
    For example if page that has been loaded and hasn't got angular, the next error would be thrown : `Error: function timed out after 10000 milliseconds . . .` . Instead of protractor's :
    `Error: Error while running testForAngular: asynchronous script timeout: result was not received in 4 seconds . . .` .
    So it must be handled manually by setting cucumbers's timeout greater then protractor's is at the hooks.js. For example if you set up protractor's timeout 9000 miliseconds , so cucumber must be at least 1 second greater = 10000 miliseconds. Example :
    
    ```javascript
    var { setDefaultTimeout } = require('cucumber');
    
    setDefaultTimeout(10000);
    ```

2. Create Report Portal configuration file
   For example `./rpConfig.json`

   In example below `${text}` - is used as placeholder for your data. This data you must get from ReportPortal profile.
    
    ```json
    {
      "token": "${rp.token}",
      "endpoint": "${rp.endpoint}/api/v1",
      "launch": "${rp.launch}",
      "project": "${rp.your_project}",
      "takeScreenshot": "onFailure",
      "description": "Awesome launch description.",
      "attributes": [
        {
          "key": "launchAttributeKey",
          "value": "launchAttributeValue"
        }
      ],
      "mode": "DEFAULT",
      "debug": false,
      "restClientConfig": {
        "timeout": 0
      }
    }
    ```

    `takeScreenshot` - if this option is defined then framework will take screenshot with _protractor or webdriver_ API if step has failed<br/>
    `mode` - Launch mode. Allowable values *DEFAULT* (by default) or *DEBUG*.<br/>
    `debug` - this flag allows seeing the logs of the `client-javascript`. Useful for debugging.
    `restClientConfig` (optional) - The object with `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, may contain other client options eg. `timeout`.

3. Create Report Portal formatter in a new js file, for example `reportPortalFormatter.js`:

    ```javascript
    const { createRPFormatterClass } = require('@reportportal/agent-js-cucumber');
    const config = require('./rpConfig.json');
    
    module.exports = createRPFormatterClass(config);
    ```

4. Import RPWorld (provides API for logging and data attaching) into /features/step_definitions/support/world.js
    
    ```javascript
    let { setWorldConstructor } = require('cucumber');
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

### TODO parallel launch

## Rerun

To report [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md) to the report portal you need to specify the following options to the config file:

- rerun - to enable rerun
- rerunOf - UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name

Example:

```json
  "rerun": true,
  "rerunOf": "f68f39f9-279c-4e8d-ac38-1216dffcc59c"
```

## Step reporting configuration

By default, this agent reports the following structure:

- feature - SUITE
- scenario - TEST
- step - STEP

You may change this behavior to report steps to the log level by enabling scenario-based reporting:

- feature - TEST
- scenario - STEP
- step - log item

To report your steps as logs, you need to pass an additional parameter to the agent config: `"scenarioBasedStatistics": true`

```json
{
  "scenarioBasedStatistics": true
}
```

This will report your your steps with logs to a log level without creating statistics for every step.

## Reporting skipped cucumber steps as failed

By default, cucumber marks steps which follow a failed step as `skipped`. 
When `scenarioBasedStatistics` is set to `false` (the default behavior) 
Report Portal reports these steps as failures to investigate. 

To change this behavior and instead mark skipped steps which follow a failed step as `cancelled`, 
you need to add an additional parameter to the agent config: `"reportSkippedCucumberStepsOnFailedTest": false`

```json
{
  "reportSkippedCucumberStepsOnFailedTest": false
}
```

Steps which are marked as `skipped` that do not follow a failed step will continue to mark the step and the scenario as `skipped`. 

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
To send attachment to the launch just specify `entity: 'launch'` property.

Also `this.screenshot` and `this.launchScreenshot` methods can be used to take screenshots.

```javascript
Then(/^I should see my new task in the list$/, function(callback) {
  this.screenshot('This screenshot')
    .then(() => callback())
    .catch((err) => callback(err));
  this.launchScreenshot('This is screenshot for launch')
    .then(() => callback())
    .catch((err) => callback(err));
});
```

`screenshot`/`launchScreenshot` function return promise fulfilled after `screenshot` is taken and image added to attachments.
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

To add attributes to the items you can use the next method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addAttributes([{ key: 'agent', value: 'cucumber' }]);
});
```

The attributes will be concatenated.

### Description

Description for features and scenarios are parsed from their definition.

To add description to the items you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.addDescription('Test item description.');
});
```

The description will be concatenated.

### TestCaseId

To set test case id to the items you can use the following method:

```javascript
Then(/^I should see my new task in the list$/, function() {
  this.setTestCaseId('itemTestCaseId');
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

To set status to the **item** you can use the next methods:

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
