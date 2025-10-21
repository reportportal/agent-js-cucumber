
## [5.6.1] - 2025-10-21
### Added
- OAuth 2.0 Password Grant authentication, check [Authentication Options](https://github.com/reportportal/agent-js-cucumber?tab=readme-ov-file#authentication-options) for more details.
- Allow configuring the HTTP retry strategy via `restClientConfig.retry` and tune the [default policy](https://github.com/reportportal/client-javascript?tab=readme-ov-file#retry-configuration).
### Changed
- `@reportportal/client-javascript` bumped to version `5.4.3`.

## [5.6.0] - 2025-09-02
### Added
- `@cucumber/cucumber` version 12 support. Addressed [181](https://github.com/reportportal/agent-js-cucumber/issues/181).
### Changed
- **Breaking change** Drop support of Node.js 14. The version [5.5.0](https://github.com/reportportal/agent-js-cucumber/releases/tag/v5.5.0) is the latest that supports it.
- Revert time format back to milliseconds (based on [#217](https://github.com/reportportal/client-javascript/issues/217#issuecomment-2659843471)). This is also fixing the issue with agents installation on ARM processors [#212](https://github.com/reportportal/agent-js-cypress/issues/212).
- `@reportportal/client-javascript` bumped to version `5.4.1`.
### Security
- Updated versions of vulnerable packages (axios).


## [5.5.2] - 2025-05-13
### Fixed
- Adjusted retrieval of active features. Addressed [168](https://github.com/reportportal/agent-js-cucumber/issues/168)

## [5.5.1] - 2025-02-26
### Added
- `launchId` option to the config to attach run results to an existing launch. Related to parallel execution on one and several machines.

## [5.5.0] - 2024-10-01
### Added
- `@cucumber/cucumber` version 11 support. Addressed [169](https://github.com/reportportal/agent-js-cucumber/issues/169).
### Changed
- **Breaking change** Drop support of Node.js 12. The version [5.4.0](https://github.com/reportportal/agent-js-cucumber/releases/tag/v5.4.0) is the latest that supports it.
- The agent now supports reporting the time for launches, test items and logs with microsecond precision in the ISO string format.
For logs, microsecond precision is available on the UI from ReportPortal version 24.2.
- `@reportportal/client-javascript` bumped to version `5.3.0`.
### Deprecated
- Node.js 14 usage. This minor version is the latest that supports Node.js 14.

## [5.4.0] - 2024-07-17
### Added
- New API methods for scenarios.
### Fixed
- Scenario retries are inconsistently tagged. Addressed [#142](https://github.com/reportportal/agent-js-cucumber/issues/142).
### Changed
- `@reportportal/client-javascript` bumped to version `5.1.4`, new `launchUuidPrintOutput` types introduced: 'FILE', 'ENVIRONMENT'.
### Security
- Updated versions of vulnerable packages (braces).
### Deprecated
- Node.js 12 usage. This minor version is the latest that supports Node.js 12.

## [5.3.1] - 2024-04-30
### Security
- Updated versions of vulnerable packages (@reportportal/client-javascript, @cucumber/cucumber).

## [5.3.0] - 2024-02-07
### Added
- `@cucumber/cucumber` version 10 support. Addressed [155](https://github.com/reportportal/agent-js-cucumber/issues/155).
### Changed
- **Breaking change** Drop support of cucumber <7. Addressed [153](https://github.com/reportportal/agent-js-cucumber/issues/153).
- **Breaking change** Drop support of Node.js 10. The version [5.2.3](https://github.com/reportportal/agent-js-cucumber/releases/tag/v5.2.3) is the latest that supports it.
- `@reportportal/client-javascript` bumped to version `5.1.0`.

## [5.2.3] - 2024-01-19
### Deprecated
- Node.js 10 usage. This version is the latest that supports Node.js 10.
### Changed
- `@reportportal/client-javascript` bumped to version `5.0.15`.
### Security
- Updated versions of vulnerable packages (@babel/traverse, follow-redirects).

## [5.2.2] - 2023-07-18
### Added
- `@cucumber/cucumber` version 9 support. Addressed [147](https://github.com/reportportal/agent-js-cucumber/issues/147).
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
- `@cucumber/cucumber` versions 7-8 support.
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
