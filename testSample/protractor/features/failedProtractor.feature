Feature: Protractor failed test
  Scenario: This feture should be failed during the page load
    Given I go to the page with url : 'https://notexistingpage'
    Then I send text to the toDo list : 'Report portal is the best'
    Given I go to the page with url : 'https://angularjs.org'