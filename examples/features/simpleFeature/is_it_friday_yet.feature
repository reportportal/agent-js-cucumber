@SuiteK:suiteV @suiteV2
Feature: Is it Friday yet?
  Everybody wants to know when it's Friday

  @testV
  Scenario Outline: Today is or is not Friday
    Description of scenario

    Given today is "<day>"
    When I ask whether it's Friday yet
    Then I should be told "<answer>"

    Examples:
      | day            | answer |
      | Friday         | TGIF   |
      | Sunday         | Nope   |
      | anything else! | Nope   |

  Scenario: Today is or is not Monday (but it's failing)
    Given today is Monday
    When I ask whether it's Monday yet
    Then I should be told Yes

  Scenario: Today is Tuesday, not Monday (but it's failing)
    Given today is Tuesday
    When I ask whether it's Monday yet
    Then I should be told Nope
