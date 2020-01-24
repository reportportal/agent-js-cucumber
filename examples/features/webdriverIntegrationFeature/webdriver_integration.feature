Feature: Webdriver integration

  Scenario: Open cucumber-js GitHub page
    Given I am on the Cucumber.js GitHub repository
    When I click on 'CLI'
    # just for the test fail
    Then I should see 'TEST FAIL'
