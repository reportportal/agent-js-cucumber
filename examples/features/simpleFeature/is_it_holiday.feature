Feature: Is it Holiday yet?
  Everybody wants to know when Saturday is

  Background: Load Holidays
    Given list of holidays

  Scenario Outline: Today is or is not Holiday
    Description of scenario

    Given today is "<day>"
    When I ask wheter it's Holiday
    Then I should be told "<answer>"

    Examples:
      | day            | answer |
      | Presidents     | Yes    |
      | Valentines     | Nope   |
      | Independence   | Yes    |
      | St.Patrick's   | Nope   |

  Scenario: April Fool's is not Holiday
    Description of scenario

    Given today is "Apirl Fool's"
    When I ask wheter it's Holiday
    Then I should be told "Nope"