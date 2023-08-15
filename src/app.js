const express = require('express')
const app = express()
const cors = require('cors')
//const cron = require('node-cron')
const ethers = require('ethers')
const srcDir = require('find-config')('src')
const bodyParser = require('body-parser')
const storage = require('find-config')('storage')
const fs = require('fs')
if (!fs.existsSync(storage)){
    fs.mkdirSync('./storage')
}
//const db = require(srcDir + '/db')
const main = require(srcDir + '/main')
const auth = require(srcDir + '/auth')
const morgan = require('morgan')
const path = require('path')
const rfs = require('rotating-file-stream')

//const port = 3001

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, '../', 'log')
})

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(morgan('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}))
app.use(morgan('combined', { stream: accessLogStream }, { flags: 'a' }))

app.get('/luckyball/api/ping', async (req, res, next) => {
  try {
    res.json({ data: 'pong' })

  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getUserBalls', async (req, res, next) => {
  try {
    let { owner, seasonId } = req.query
    owner = ethers.getAddress(owner)
    const data = await main.getUserBalls(owner, seasonId)
    res.json({ data })

  } catch(err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getSeason', async (req, res, next) => {
  try {
    const { seasonId } = req.query
    const data = await main.getSeason(seasonId)
    res.json({ data })

  } catch(err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getRelayData', async (req, res, next) => {
  try {
    let { owner } = req.query
    owner = ethers.getAddress(owner)
    const data = await main.getRelayData(owner)
    res.json({ data })

  } catch(err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/relayRequestReveal', async (req, res, next) => {
  try {
    let { owner, deadline, v, r, s } = req.body
    owner = ethers.getAddress(owner)
    const isNeeded = await main.isRevealNeededUser(owner)
    
    if (!isNeeded) {
      return res.status(400).json({ err: 'This address has no ball to reveal yet'})
    }
    const txid = await main.relayRequestReveal(owner, deadline, v, r, s)
    res.json({ data:  txid  })

  } catch (err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getRevealTime', async (req, res, next) => {
  try {
    const data = await main.nextRevealTime()
    res.json({ data })

  } catch(err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})
  
//admin features

app.post('/luckyball/api/genAccessToken', auth.protectedRefresh, async (req, res, next) => {
  try {
    if (req.isRefreshToken) {
      const token = auth.generateAccessToken(req.user)
      return res.json({ data: token })
    } else {
      res.status(401).json({ err: 'A valid refreshToken is needed'})  
    }
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/startSeason', auth.protectedAccess, async (req, res, next) => {
  try {
    const txid = await main.startSeason()

    res.json({ data: txid })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/issueBalls', auth.protectedAccess, async (req, res, next) => {
  try {
    const { addrList, qtyList } = req.body
    const txid = await main.issueBalls(addrList, qtyList)
    res.json({ data: txid })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})
 
app.post('/luckyball/api/requestRevealGroupSeed', auth.protectedAccess, async (req, res, next) => {
  try {
    const txid = await main.requestRevealGroupSeed()
    if (!txid) {
      return res.status(400).json({ err: 'Nohting to reveal'})
    }
    res.json({ data: txid })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/endSeason', auth.protectedAccess, async (req, res, next) => {
  try {
    const txid = await main.endSeason()

    res.json({ data: txid })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

module.exports = app
