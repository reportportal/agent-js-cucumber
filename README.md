# agent-js-cucumber

This cucumber agent works well with cucumber versions from 4.x to 6.x inclusive

## Install agent to your project dir

```cmd
npm i reportportal-agent-cucumber
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
                  L hooks.js
                  L world.js
  L package.json
```

### Note

Protractor and Cucumber have their own **timeouts** . When protractror start main process that lauches cucumber it would have different timeouts if there not the same they would wait for scripts different time. If cucumbers's timeout less then protractor's it would through wrong exeption. For example if page that has been loaded and hasn't got angular, the next error would be thrown : `javascript Error: function timed out after 10000 milliseconds . . .` . Instead of protractor's :
`javascript Error: Error while running testForAngular: asynchronous script timeout: result was not received in 4 seconds . . .` .
So it must be handled manually by setting cucumbers's timeout greater then protractor's is at the hooks.js. For example if you set up protractor's timeout 9000 miliseconds , so cucumber must be at least 1 second greater = 10000 miliseconds . example could example :

```javascript
var { setDefaultTimeout } = require('cucumber');

setDefaultTimeout(10000);
```

2. Create Report Portal configuration file
   For example `./rpConfig.json`

   In example below `\${text}` - is used as placeholder for your data. This data you must get from ReportPortal profile.

```javascript
{
  "token": "${rp.token}",
  "endpoint": "${rp.endpoint}/api/v1",
  "launch": "${rp.launch}",
  "project": "${rp.your_project}",
  "takeScreenshot": "onFailure",
  "attributes": [
    {
      "key": "launchAttributeKey",
      "value": "launchAttributeValue"
    }
  ]
}

```

takeScreenshot - if this option is defined then framework will take screenshot with _protractor or webdriver_ API if step has failed

3. Create Report Portal formatter in a new js file, for example `reportPortalFormatter.js`:

```javascript
const { createRPFormatterClass } = require('reportportal-agent-cucumber');
const config = require('./rpConfig.json');

module.exports = createRPFormatterClass(rpConfig);
```

4. Import World for logging into /features/step_definitions/support/world.js

```javascript
let { setWorldConstructor } = require('cucumber');
let { Logger } = require('reportportal-agent-cucumber');
setWorldConstructor(Logger);
```

If you have other world constructors it must be used with the logger as shown below

```javascript
class CustomWorld extends Logger {
  constructor(...args) {
    super(...args);

    /*
     * any driver container must be named 'browser',because reporter could be used with cucumber
     * and protractor. And protractor has global object browser which contains all web-driver methods
     */
    global.browser = new seleniumWebdriver.Builder().forBrowser('chrome').build();
  }
}

setWorldConstructor(CustomWorld);
```

    It will allow you  send logs and screenshots to RP directly step definitions
    **All this logs would be attached to test data and could be viewed at the Report Portal**
    For Example:

```javascript
Then(/^I should see my new task in the list$/, function(callback) {
  this.info('This is Info Level log');
  this.debug('This is Debug Level log');
  this.error('This is Error Level log');
  this.warn('This is Warn Level log');
  this.screenshot('This screenshot')
    .then(() => callback())
    .catch((err) => callback(err));
});
```

screenshot function return promise fulfilled after screenshot is taken and image added to attachments.
Handler will parse attachments and send corresponding log to the step item.

5. Run cucumber-js

`cucumber-js -f ./reportPortalFormatter.js`

### TODO parallel launch

### Run test sample .

For running test sample clone agent-js-cucumber .
At the working directory run

`npm i` - that would install all dependencies.

`npm i cucumber --no-save` - to install cucumber as a peer dependency. You can specify needed version by replacing `cucumber` with `cucumber@<version>`, for example, `cucumber@6`.

Change config file `examples/config/rpConfig.json`.

Then run npm tasks with `example:` prefix. For example, `example:simple`.

## Rerun

To report [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md) to the report portal you need to specify the following options:

- rerun - to enable rerun
- rerunOf - UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name

Example:

```json
  "rerun": true,
  "rerunOf": "f68f39f9-279c-4e8d-ac38-1216dffcc59c"
```

# Copyright Notice

Licensed under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.html)
license (see the LICENSE.txt file).
