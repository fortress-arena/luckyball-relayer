const express = require('express')
const app = express()
const cron = require('node-cron');
const srcDir = require('find-config')('src')
const storage = require('find-config')('storage')
const fs = require('fs')

let { REVEAL_SCHEDULE, DOWNLOAD_SCHEDULE } = require(srcDir + '/config')

//if (!fs.existsSync(storage)){
//    fs.mkdirSync('./storage')
//}

const main = require(srcDir + '/main')
const port = 3002

app.get('/', (req, res) => {
  res.send('Hello World!')
})

main.downloadBalls()
//fallback when subscrition fails
const cronDownloadBalls = cron.schedule(DOWNLOAD_SCHEDULE, function() {
  main.downloadBalls()
  console.log('running downloadBalls every 10 minutes');
})

const cronRequestRevealGroupSeed = cron.schedule(REVEAL_SCHEDULE, function() {
    main.requestRevealGroupSeed()
  console.log('running requestRevealGroupSeed every 2 hours');
})

main.startEventSubscription() 
//subscription handles all event monitoring

app.listen(port, () => {
  console.log(`LuckyBall Indexer server listening at ${port}`)
})

module.exports = app