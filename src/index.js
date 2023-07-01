const express = require('express')
const app = express()
const cors = require('cors')
const ethers = require('ethers')
const assert = require('assert')
//const cron = require('node-cron');
const srcDir = require('find-config')('src')
//const cronJob = require(srcDir + '/cron')
const port = 3001
const bodyParser = require('body-parser')
const storage = require('find-config')('storage')
const log = require('simple-node-logger').createSimpleLogger();
const fs = require('fs')
if (!fs.existsSync(storage)){
    fs.mkdirSync('./storage');
}
const db = require(srcDir + '/db')
const main = require(srcDir + '/main')

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors())
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/luckyball/api/ping', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckball/api/ping'
  try {
    log.info({ ip, uri })
    res.send('pong')

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getUserBalls', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckball/api/getUserBalls'
  try {
    log.info({ ip, uri })
    const { address, seasonId } = req.query
    const data = await main.getUserBalls(address, seasonId)
    res.send(data)

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getSeason', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckball/api/getSeason'
  try {
    log.info({ ip, uri })
    const { seasonId } = req.query
    const data = await main.getSeason(seasonId)
    res.send(data)

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

  
app.post('/luckyball/api/sample', async (req, res, next) => {
  try {
    const { data } = req.body

    res.send({ data })
  } catch (err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})  
/*
cron.schedule('* * * * *', function() {
  cronJob.batchPayPoll()
  console.log('running a task every minute');
});
*/

app.listen(port, () => {
  console.log(`LuckyBall Relay/Operator server listening at ${port}`)
})