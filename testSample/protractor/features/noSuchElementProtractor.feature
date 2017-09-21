@protractor
Feature: Protractor no such element
  Scenario: It must failed
    Given I go to the page with url : 'https://angularjs.org'
    Then It must throws noSuchElement error