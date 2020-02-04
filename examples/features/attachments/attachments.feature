Feature: attachments

  Scenario Outline: Attachment reporting
    When I report attachment with type "<type>" and "<file>"

    Examples:
      | type             | file      |
      | text/html        | test.html |
      | application/json | test.json |
      | application/css  | test.css  |
      | image/jpeg       | test.jpg  |
      | image/png        | test.png  |
      | video/mp4        | test.mp4  |
