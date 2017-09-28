const ReportPortalClient = require('reportportal-client')
const Path = require('path')
const util = require('util')

module.exports = (config) => {
  getCuceJSON = (json) => {
    try {
      let jsonObject = JSON.parse(json)
      if (jsonObject && typeof jsonObject === 'object') {
        return jsonObject
      }
    } catch (error) {
    }
    return false
  }

  getEventUri = uri => uri.replace(process.cwd() + Path.sep, '')
  cleanReportContext = () => {
    return {
      outlineRow: 0,
      scenarioStatus: 'failed',
      forcedIssue: null,
      featureId: null,
      scenarioId: null,
      stepId: null,
      stepStatus: 'failed',
      launchId: null,
      failedScenarios: 0,
      lastScenarioDescription: null
    }
  }

  let reportportal = new ReportPortalClient(config)
  let context = cleanReportContext()
  let tagsConf = !config.tags ? [] : config.tags

  reportPortalHandlers = function () {
    this.registerHandler('BeforeFeatures', (event, callback) => {
      const startObj = config.id ? {id: config.id} : {}
      const launchObj = reportportal.startLaunch(startObj)
      context.launchId = launchObj.tempId
      callback()
    })

    this.registerHandler('BeforeFeature', (event, callback) => {
      let featureUri = getEventUri(event.uri)
      let description = featureUri// event.description ? reportportal._formatName(event.description) : featureUri
      let name = event.name
      let launchObj = reportportal.startTestItem({
        name: name,
        type: 'SUITE',
        description: description,
        tags: event.tags ? event.tags.map(tag => tag.name) : []
      }, context.launchId)
      context.featureId = launchObj.tempId
      callback()
    })
    this.registerHandler('BeforeScenario', (event, callback) => {
      let keyword = event.keyword
      let name = [keyword, event.name].join(': ')

      let description = [getEventUri(event.uri), event.line].join(':')
      if (context.lastScenarioDescription !== name) {
        context.lastScenarioDescription = name
        context.outlineRow = 0
      } else {
        context.outlineRow++
        name += ' [' + context.outlineRow + ']'
      }

      let launchObj = reportportal.startTestItem({
        name: name,
        type: 'TEST',
        description: description,
        tags: event.tags ? event.tags.map(tag => tag.name) : []
      }, context.launchId, context.featureId)
      context.scenarioId = launchObj.tempId
      callback()
    })

    this.registerHandler('BeforeStep', (event, callback) => {
      let args = []
      if (event.arguments && event.arguments.length) {
        event.arguments.forEach(arg => {
          if (arg.constructor.name === 'DocString') {
            args.push(arg.content)
          } else if (arg.constructor.name === 'DataTable') {
            arg.rawTable.map(row => row.join('|').trim()).forEach(line => {
              args.push('|' + line + '|')
            })
          }
        })
      }
      let name = event.name ? `${event.keyword} ${event.name}` : event.keyword
      let launchObj = reportportal.startTestItem({
        name: name,
        type: 'STEP',
        description: args.length ? args.join('\n').trim() : ''
      }, context.featureId, context.scenarioId)
      context.stepId = launchObj.tempId
      callback()
    })
    this.registerHandler('StepResult', (event, callback) => {
      let sceenshotName = !event.stepDefinition ? 'UNDEFINED STEP' : `Failed at step definition line:${event.stepDefinition.line}`
      if (event.attachments && event.attachments.length && (event.status === 'passed' || event.status === 'failed')) {
        event.attachments.forEach(attachment => {
          switch (attachment.mimeType) {
            case 'text/plain': {
              let logMessage = getCuceJSON(attachment.data)
              let request = {}
              if (logMessage) {
                request.level = logMessage.level
                request.message = logMessage.message
              } else {
                request.level = 'DEBUG'
                request.message = attachment.data
              }
              reportportal.sendLog(context.stepId, request)
              break
            }
            case 'image/png': {
              let request = {
                level: context.stepStatus === 'passed' ? 'DEBUG' : 'ERROR'
              }
              let screenObj = { name: sceenshotName,
                type: 'image/png'}
              let pngObj = getCuceJSON(attachment.data)
              if (pngObj) {
                request.message = pngObj.message
                screenObj.content = pngObj.data
              } else {
                request.name = sceenshotName
                request.message = sceenshotName
                screenObj.content = attachment.data
              }
              reportportal.sendLog(context.stepId, request, screenObj)
              break
            }
          }
        })
      }
      switch (event.status) {
        case 'passed': {
          context.stepStatus = 'passed'
          context.scenarioStatus = 'passed'
          callback()
          break
        }
        case 'pending': {
          reportportal.sendLog(context.stepId, {
            level: 'WARN',
            message: "This step is marked as 'pending'"
          })
          context.stepStatus = 'not_implemented'
          context.scenarioStatus = 'failed'
          context.failedScenarios++
          callback()
          break
        }
        case 'undefined': {
          reportportal.sendLog(context.stepId, {
            level: 'ERROR',
            message: 'There is no step definition found. Please verify and implement it.'
          })
          context.stepStatus = 'not_found'
          context.scenarioStatus = 'failed'
          context.failedScenarios++
          callback()
          break
        }
        case 'ambiguous': {
          reportportal.sendLog(context.stepId, {
            level: 'ERROR',
            message: 'There are more than one step implementation. Please verify and reimplement it.'
          })
          context.stepStatus = 'not_found'
          context.scenarioStatus = 'failed'
          context.failedScenarios++
          callback()
          break
        }
        case 'skipped': {
          context.stepStatus = 'skipped'
          if (context.scenarioStatus === 'failed') {
            context.scenarioStatus = 'skipped'
          }
          callback()
          break
        }
        case 'failed': {
          context.stepStatus = 'failed'
          context.failedScenarios++
          let errorMessage = `${event.stepDefinition.uri}\n ${util.format(event.failureException)}`
          const errorObj = {
            level: 'ERROR',
            message: errorMessage
          }
          if (browser && config.takeScreenshot && config.takeScreenshot === 'onFailure') {
            browser.takeScreenshot()
              .then(png => {
                reportportal.sendLog(context.stepId,
                  errorObj, {
                    name: sceenshotName,
                    type: 'image/png',
                    content: png
                  })
                callback()
              })
          } else {
            reportportal.sendLog(context.stepId, errorObj)
            callback()
          }
          break
        }
      }
    })
    this.registerHandler('AfterStep', (event, callback) => {
      let request = {
        status: context.stepStatus
      }
      if (request.status === 'not_found') {
        request.status = 'failed'
        request.issue = {
          issue_type: 'AUTOMATION_BUG', comment: 'STEP DEFINITION WAS NOT FOUND'
        }
      } else if (request.status === 'not_implemented') {
        request.status = 'skipped'
        request.issue = {
          issue_type: 'TO_INVESTIGATE', comment: 'STEP IS PENDING IMPLEMENTATION'
        }
      }
      let launchObj = reportportal.finishTestItem(context.stepId, request)
      callback()
    })
    this.registerHandler('ScenarioResult', (event, callback) => {
      let launchObj = reportportal.finishTestItem(context.scenarioId, {
        status: event.status !== 'PASSED' ? 'failed' : 'passed'
      })
      context.scenarioStatus = 'failed'
      context.scenarioId = null
      callback()
    })
    this.registerHandler('AfterFeature', (event, callback) => {
      let featureStatus = context.failedScenarios > 0 ? 'failed' : 'passed'
      reportportal.finishTestItem(context.featureId, {
        status: featureStatus
      })

      callback()
    })
    this.registerHandler('AfterFeatures', (event, callback) => {
      if (!config.id) {
        reportportal.finishLaunch(context.launchId, {}).promise.then(() => {
          context = cleanReportContext()
          callback()
        })
      } else {
        reportportal.getPromiseFinishAllItems(context.launchId).then(() => {
          callback()
        })
      }
    })
  }
  return reportPortalHandlers
}
