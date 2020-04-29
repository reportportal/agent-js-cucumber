const AFTER_HOOK_URI_TO_SKIP = 'protractor-cucumber-framework';
const STATUSES = {
  PASSED: 'passed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  PENDING: 'pending',
  NOT_IMPLEMENTED: 'not_implemented',
  UNDEFINED: 'undefined',
  NOT_FOUND: 'not_found',
  AMBIGUOUS: 'ambiguous',
};

module.exports = {
  AFTER_HOOK_URI_TO_SKIP,
  STATUSES,
};
