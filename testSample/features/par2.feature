Feature: Logging two

  @scenario
  Scenario: Log messages at the different level
    Given I log warn and error messages
    When I log number '3' at the info level
    Then I log number '4' at the debug level
