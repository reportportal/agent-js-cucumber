@yo @superTest
Feature: Webdriver feature
  As a user of Cucumber.js
  I want to have documentation on Cucumber
  So that I can concentrate on building awesome applications

  Scenario: It must load github page and failed

    Given I am on the Cucumber.js GitHub repository
    When I click on 'CLI'
    # just for the test fail
    Then I should see 'TEST FAIL'