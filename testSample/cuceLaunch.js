'use strict'
const {spawn} = require('child_process'),
    config = require('./config/rpConfig.json'),
    reportPortal = require('reportportal-client'),
    rp = new reportPortal(config);

rp.startLaunch(
    Object.assign({
        start_time: rp._now(),
    }, config)
).then(id => {
    let cuce = spawn('npm', ['run', 'test', `--id=${id.id}`]);
    cuce.stdout.on('data', (data) => {
        console.log(data.toString());
    })
    cuce.stderr.on('data', (data) => {
        console.log(data.toString());
    });

    cuce.on('close', (code) => {
        rp.finishLaunch(id.id, {
            end_time: rp._now()
        })
            .then(result => console.log('exit with code ' + code))
            .catch(err => {
                console.log("Error occured dring finishing launch", err);
            });
    });
})
    .catch(err => {
        console.log('Failed to start launch due to error', config.launch, err);
    })


