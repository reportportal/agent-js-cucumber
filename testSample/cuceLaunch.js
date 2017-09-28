'use strict'
const {spawn} = require('child_process')
const config = require('./config/rpConfig.json')
const ReportPortal = require('reportportal-client')
const rp = new ReportPortal(config)
/*
 * Parallel launch example of cucumber with webdriver
 */
const launchObj = (rp.startLaunch({}))
launchObj.promise.then(id => {
  let cuce = spawn('npm', ['run', 'test', `--id=${id.id}`])

  cuce.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  cuce.stderr.on('data', (err) => {
    console.log(err.toString())
  })

  cuce.on('close', (code) => {
    rp.finishLaunch(launchObj.tempId, {}).promise
      .then(result => console.log('exit with code ' + 'code'))
      .catch(err => {
        console.log('Error occured dring finishing launch', err)
      })
  })
})

/*
 * Protractor launch example
 */
const protLaunchObj = rp.startLaunch({})
protLaunchObj.promise.then(id => {
  let protractor = spawn('npm', ['run', 'protractorTest', `--id=${id.id}`])

  protractor.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  protractor.stderr.on('data', (data) => {
    console.log(data.toString())
  })
  protractor.on('close', (code) => {
    rp.finishLaunch(protLaunchObj.tempId).promise
      .then(result => console.log('exit with code ' + code))
      .catch(err => {
        console.log('Error occured dring finishing launch', err)
      })
  })
})