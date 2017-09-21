@noSuchElement
Feature: Protractor sample
  Scenario: It should load angular page
    Given I go to the page with url : 'https://angularjs.org'
    Then I send text to the toDo list : 'Report portal is the best'
