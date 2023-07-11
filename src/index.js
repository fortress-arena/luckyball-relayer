const express = require('express')
const app = express()
const cors = require('cors')
const cron = require('node-cron');
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

const port = 3001

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


app.get('/', (req, res) => {
  res.send('Hello World!')
})

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
    const { owner, seasonId } = req.query
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

app.post('/luckyball/api/sample', async (req, res, next) => {
  try {
    const { data } = req.body
    res.json({ data })

  } catch (err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.get('/luckyball/api/getRelayData', async (req, res, next) => {
  try {
    const { owner } = req.query
    const data = await main.getRelayData(owner)
    res.json({ data })

  } catch(err) {
    res.status(400).send({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/relayRequestReveal', async (req, res, next) => {
  try {
    const { owner, deadline, v, r, s } = req.body
    const isNeeded = await main.isRevealNeededUser(owner)
    
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

app.get('/luckyball/api/protected', auth.protected, (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]    
    res.json({ data: token })

  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/startSeason', auth.protected, async (req, res, next) => {
  try {
    const txid = await main.startSeason()

    res.json({data: { txid }})    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/issueBalls', auth.protected, async (req, res, next) => {
  try {
    const { addrList, qtyList } = req.body
    const txid = await main.issueBalls(addrList, qtyList)
    res.json({ data: { txid } })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})

app.post('/luckyball/api/requestRevealGroupSeed', auth.protected, async (req, res, next) => {
  try {
    const txid = await main.requestRevealGroupSeed()
    if (!txid) {
      return res.status(400).json({ err: 'Nohting to reveal'})
    }
    res.json({ data: { txid } })    
  } catch(err) {
    res.status(400).json({ err: err.message })
    next(err)
  }
})


const cronDownloadBalls = cron.schedule('* * * * *', function() {
  main.downloadBalls()
  console.log('running downloadBalls every minute');
})

const cronRequestRevealGroupSeed = cron.schedule('* */2 * * *', function() {
  main.requestRevealGroupSeed()
  console.log('running requestRevealGroupSeed every 2 hours');
})

app.listen(port, () => {
  console.log(`LuckyBall Relay/Operator server listening at ${port}`)
})