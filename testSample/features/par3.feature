Feature: Logging three

  @scenario
  Scenario: Log messages at the different level
    Given I log warn and error messages
    When I log number '5' at the info level
    Then I log number '6' at the debug level
