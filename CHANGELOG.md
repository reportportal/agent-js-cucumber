### Changed
- `token` configuration option was renamed to `apiKey` to maintain common convention.
- `@reportportal/client-javascript` bumped to version `5.0.12`.

## [5.2.1] - 2023-02-21
### Added
- Provide BDD entities titles to their names
- Screenshot attaching on failure
- Parallel reporting support 
### Fixed
- Finish feature/scenario only when its children have already been finished
- [#130](https://github.com/reportportal/agent-js-cucumber/issues/130) DEBUG mode in the config file does not report to Debug

## [5.1.1] - 2023-01-05
### Fixed
- [#118](https://github.com/reportportal/agent-js-cucumber/issues/118) Scenarios in separate Feature files are reported under same Feature
- [#119](https://github.com/reportportal/agent-js-cucumber/issues/119) Status interrupted for second scenario
- Cucumber <6 version compatibility issues

## [5.1.0] - 2022-11-29
### Added
- Added support for 7-8 versions of `@cucumber/cucumber` package

### Updated
- `@reportportal/client-javascript` version to the latest

## [5.0.2] - 2021-06-23
### Fixed
- Launch status calculation

### Updated
- `@reportportal/client-javascript` version to the latest

## [5.0.1] - 2020-11-04
### Fixed
- [#66](https://github.com/reportportal/agent-js-cucumber/issues/66) Incorrect calculation of test status
- Lots of other bugs

### Updated
- `@reportportal/client-javascript` version to the latest

## [5.0.0] - 2020-08-28
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))

### Deprecated
- Previous package versions (`reportportal-agent-cucumber`, `agent-js-cucumber`) will no longer supported by reportportal.io
