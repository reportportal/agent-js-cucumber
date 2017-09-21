Feature: Logging feature

  @scenario
  Scenario: Log messages at the different level
    Given I log warn and error messages
    When I log number '1' at the info level
    Then I log number '2' at the debug level
