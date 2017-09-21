'use strict'
const {spawn} = require('child_process')
const config = require('./config/rpConfig.json')
const ReportPortal = require('reportportal-client')
const rp = new ReportPortal(config)
/*
 * Parallel launch example of cucumber with webdriver
 */
const launchObject = {
  name: config.launch,
  description: !config.description ? '' : config.description,
  tags: config.tags
}

rp.startLaunch(
  Object.assign({
    start_time: rp._now()
  }, launchObject)
).then(id => {
  let cuce = spawn('npm', ['run', 'test', `--id=${id.id}`])

  cuce.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  cuce.on('close', (code) => {
    rp.finishLaunch(id.id, {
      end_time: rp._now()
    })
      .then(result => console.log('exit with code ' + code))
      .catch(err => {
        console.log('Error occured dring finishing launch', err)
      })
  })
}).catch(err => {
  console.log('Failed to start launch due to error', config.launch, err)
})

/*
 * Protractor launch example
 */
rp.startLaunch(
  Object.assign({
    start_time: rp._now()
  }, launchObject)
).then(id => {
  let protractor = spawn('npm', ['run', 'protractorTest', `--id=${id.id}`])

  protractor.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  protractor.stderr.on('data', (data) => {
    console.log(data.toString())
  })
  protractor.on('close', (code) => {
    rp.finishLaunch(id.id, {
      end_time: rp._now()
    })
      .then(result => console.log('exit with code ' + code))
      .catch(err => {
        console.log('Error occured dring finishing launch', err)
      })
  })
}).catch(err => {
  console.log('Failed to start launch due to error', config.launch, err)
})
