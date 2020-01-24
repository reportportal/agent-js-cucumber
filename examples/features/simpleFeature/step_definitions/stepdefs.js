const assert = require('assert');
const { Given, When, Then, Before, After } = require('cucumber');

function isItFriday(today) {
  if (today === 'Friday') {
    return 'TGIF';
  }
  return 'Nope';
}

Before(function() {
  this.info('Before info log');
});

After(function() {
  this.info('After info log');
});

Given('today is {string}', function(givenDay) {
  this.today = givenDay;
});

When("I ask whether it's Friday yet", function() {
  this.actualAnswer = isItFriday(this.today);
});

Then('I should be told {string}', function(expectedAnswer) {
  if (this.actualAnswer !== expectedAnswer) {
    this.error(`Test error: ${this.actualAnswer} !== ${expectedAnswer}`);
  }
  assert.equal(this.actualAnswer, expectedAnswer);
});

Given('today is Monday', function() {
  this.today = 'Monday';
});

When(/^I ask whether it's Monday yet$/, function() {
  this.actualAnswer = 'Nope';
});

Then('I should be told Yes', function() {
  const expectedAnswer = 'Yes';
  if (this.actualAnswer !== expectedAnswer) {
    this.error(`Test error: ${this.actualAnswer} !== ${expectedAnswer}`);
  }
  assert.equal(this.actualAnswer, expectedAnswer);
});
