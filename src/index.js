const express = require('express')
const app = express()
const cors = require('cors')
const ethers = require('ethers')
const assert = require('assert')
const cron = require('node-cron');
const srcDir = require('find-config')('src')
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
const auth = require(srcDir + '/auth')

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors())
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/luckyball/api/ping', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/ping'
  try {
    log.info({ ip, uri })
    res.json({ data: 'pong' })

  } catch(err) {
    log.error({})
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getUserBalls', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/getUserBalls'
  try {
    log.info({ ip, uri })
    const { owner, seasonId } = req.query
    const data = await main.getUserBalls(owner, seasonId)
    res.json({ data })

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getSeason', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/getSeason'
  try {
    log.info({ ip, uri })
    const { seasonId } = req.query
    const data = await main.getSeason(seasonId)
    res.json({ data })

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/sample', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/sample'
  try {
    log.info({ ip, uri })
    const { data } = req.body
    res.json({ data })

  } catch (err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getRelayData', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/getRelayData'
  try {
    log.info({ ip, uri })
    const { owner } = req.query
    const data = await main.getRelayData(owner)
    res.json({ data })

  } catch(err) {
    log.error({})
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/relayRequestReveal', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/relayRequestReveal'
  try {
    log.info({ ip, uri })
    const { owner, deadline, v, r, s } = req.body
    const isNeeded = await main.isRevealNeeded(owner)
    
    if (!isNeeded) {
      return res.status(400).json({ err: 'This address has no ball to reveal yet'})
    }
    const txid = await main.relayRequestReveal(owner, deadline, v, r, s)
    res.json({ data: { txid } })

  } catch (err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})
  

//admin features

app.get('/luckyball/api/getAuthToken', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/auth-token'
  try {
    log.info({ ip, uri })
    //todo: implement user validation
    const { user, sig } = req.query
    const token = auth.generateAccessToken(user)
    // const token = auth.generateAccessToken(user, sig)
    return res.json({ data: token })

  } catch(err) {
    log.error({ err })
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/protected', auth.protected, (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/protected'
  try {
    log.info({ ip, uri })

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]    
    res.json({ data: token })

  } catch(err) {
    log.error({err})
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/startSeason', auth.protected, async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/startSeason'
  try {
    log.info({ ip, uri })
    const txid = await main.startSeason()

    res.json({data: { txid }})    
  } catch(err) {
    log.error({ err })
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/issueBalls', auth.protected, async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/issueBalls'
  try {
    log.info({ ip, uri })
    const { addrList, qtyList } = req.body
    const txid = await main.issueBalls(addrList, qtyList)
    res.json({ data: { txid } })    
  } catch(err) {
    log.error({ err })
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/requestRevealGroupSeed', auth.protected, async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const uri = '/luckyball/api/requestRevealGroupSeed'
  try {
    log.info({ ip, uri })
    const txid = await main.requestRevealGroupSeed()
    if (!txid) {
      return res.status(400).json({ err: 'Nohting to reveal'})
    }
    res.json({ data: { txid } })    
  } catch(err) {
    log.error({ err })
    res.status(400).json({ err: err.message })
    next(err)
  }
})


cron.schedule('* * * * *', function() {
  main.downloadBalls()
  main.requestRevealGroupSeed()
  console.log('running a task every minute');
})

app.listen(port, () => {
  console.log(`LuckyBall Relay/Operator server listening at ${port}`)
})