const cucumber = require('cucumber');
const { Logger } = require('../../../../../modules');

cucumber.setWorldConstructor(Logger);
