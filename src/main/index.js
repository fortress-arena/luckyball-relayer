const ethers = require('ethers')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const srcDir = require('find-config')('src')
//const sleep = require('util').promisify(setTimeout)
const { readMnemonic } = require(srcDir + '/keyman')
const db = require(srcDir + '/db')
require('dotenv').config({ path: require('find-config')('.env') })
const parser = require('cron-parser')
let { networkId, provider, wallet, contract, alchemyWs, contractAbi, 
  contractAddr, REVEAL_SCHEDULE, walletRefreshToken, walletApi } = require(srcDir + '/config')
//let config = require(srcDir + '/config')

//const testWords = 'skin ride electric require nest run wagon nose ritual mammal fossil canyon'
let walletAccessToken

const dbReset = () => {
  db.put('last-block', 1)
}

const getWalletAccessToken = async(refreshToken) => {
  if(walletAccessToken && jwt.decode(walletAccessToken).exp > Date.now()/1000 + 10) {
    return walletAccessToken
  } 
  refreshToken = refreshToken || walletRefreshToken
  if(jwt.decode(refreshToken).exp < Date.now()/1000) {
    throw('Wallet refresh token expired')
  }

  walletAccessToken = (await axios.post(
    walletApi + 'genAccessToken', {}, 
    { headers: { Authorization: `Bearer ${refreshToken}` }}
  )).data.accessToken
  return walletAccessToken
}

const sendTransaction = async (txData) => {
  return (await axios.post(
    walletApi + 'sendTransaction', 
    { networkId, txData }, 
    { headers: { Authorization: `Bearer ${await getWalletAccessToken()}`, 
                 'Content-Type': 'application/json' }}
  )).data  
}

const relayRequestReveal = async (owner, deadline, v, r, s) => {
  const txData = await contract.relayRequestReveal.populateTransaction(owner, deadline, v, r, s)
  return await sendTransaction(txData)
}

const getCurrentSeasonId = async () => {  
  return Number(await contract.getCurrentSeasonId())
}

const getSeason = async (seasonId) => {
  seasonId = seasonId || await getCurrentSeasonId()
  const data = await contract.seasons(seasonId)
  let startBallId = Number(data[1])
  let endBallId = Number(data[2])
  let winningBallId = Number(data[3])
  let winningCode = Number(data[4])
  let isActive = data[5]
  let seasonBallCount = endBallId - startBallId + 1

  if (winningCode == 0) {
    return {}
  }
  if (endBallId == 0) {
    if (!db.get(`ball-${startBallId}`)) {
      startBallId = 0
      seasonBallCount = 0
    } else {
      endBallId = Number(await contract.ballCount()) 
      seasonBallCount = endBallId - startBallId + 1
    }
  }
  
  return { seasonId, seasonBallCount, startBallId, endBallId, winningBallId, winningCode, isActive }
}

const getUserBalls = async (userAddr, seasonId) => {
  seasonId = seasonId || await getCurrentSeasonId()
  const season = await contract.seasons(seasonId)
  const seasonWiningCode = Number(season[4])
  const seasonWinBallId = Number(season[3])

  const key = `owner-${userAddr}-${seasonId}`
  const ballIds = db.get(key)
  if (!ballIds) return []

  const ballList = []
  let total = ballIds.length
  let matchSum = [0,0,0,0,0,0,0]
  let seasonWin = 0
  let revealPendingCount = 0
  let unrevealCount = 0
  let isSeasonWin = false 

  for (let i=0; i < ballIds.length; i++) {
    let ballId = ballIds[i]
    let matchCount
    if (seasonWinBallId > 0 && ballId == seasonWinBallId) {
      isSeasonWin = true
    }
    let ball = db.get(`ball-${ballId}`)
    matchCount = compareCodes(ball.code, seasonWiningCode)
    if (ball.code < 0) {
      revealPendingCount += 1
    } else if (ball.code == 0) {
      unrevealCount += 1
    } else { // ball.code > 0
      matchSum[matchCount] += 1
    }

    ballList.push([ballId, ball.code, matchCount])
  }

  return { seasonId, total, unrevealCount, revealPendingCount, matchSum, seasonWinBallId, isSeasonWin, ballList }
}

const compareCodes = (codeA, codeB) => {
  if (codeA == 0 || codeB == 0) {
    return 0
  }
  codeA = Number(codeA).toString()
  codeB = Number(codeB).toString()
  let matchCount = 0
  for (let j=codeA.length - 1; j >= 0; j--) {
    let digitA = codeA.substr(j, 1)
    let digitB = codeB.substr(j, 1)
    if (digitA == digitB) {
      matchCount += 1
    } else {
      return matchCount
    }
  }
  return matchCount
}

const startSeason = async () => {
  const txData = await contract.startSeason.populateTransaction()
  return await sendTransaction(txData)
}

const endSeason = async () => {
  const txData = await contract.endSeason.populateTransaction()
  return await sendTransaction(txData)
  /*const txid  = (await axios.post(
    walletApi + 'sendTransaction', 
    { networkId, txData }, 
    { headers: { Authorization: `Bearer ${await getWalletAccessToken()}`, 
                 'Content-Type': 'application/json' }}
  )).data
  return txid  
  */
}

const issueBalls = async (addrList, qtyList) => {
  const txData = await contract.issueBalls.populateTransaction(addrList, qtyList)
  return sendTransaction(txData)
}

const getRelayData = async (address) => {
  const nonce = await contract.nonces(address)
  const domainData = await contract.getDomainInfo()
  const domain = {
    name: domainData[0],
    version: domainData[1],
    chainId: Number(domainData[2]),
    verifyingContract: domainData[3]
  }
  const types = {
    Relay: [
      { name: 'owner', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ]    
  }
  const relayData = {
    owner: address,
    deadline: Math.floor(Date.now() / 1000) + 60*60*24,
    nonce: Number(nonce)
  }
  return { domain, types, relayData }
}

const isRevealNeededUser = async (address) => {
  const seasonId = await contract.getCurrentSeasonId()
  const myGroups = await contract.getUserBallGroups(address, seasonId)
  if (myGroups.length == 0) {
    return false
  }
  const newPos = await contract.newRevealPos(address, seasonId)
  if (myGroups.length > newPos) {
    return true
  }
  return false
}


const requestRevealGroupSeed = async () => {
  const isRevealNeeded = await contract.revealNeeded()
  if (!isRevealNeeded) {
    return 
  }
  const txData = contract.requestRevealGroupSeed.populateTransaction()
  return await sendTransaction(txData)
}

const combineSig = (v, r, s) => {
  return r + s.substr(2) + v.toString(16);
}

const splitSig = (sig) => {
  if (sig.startsWith("0x")) {
    sig = sig.substring(2);
  }
  return {r: "0x" + sig.slice(0, 64), s: "0x" + sig.slice(64, 128), v: parseInt(sig.slice(128, 130), 16)};
}

const nextRevealTime = (cronSchedule) => {
  cronSchedule = cronSchedule || REVEAL_SCHEDULE
  const target = parser.parseExpression(cronSchedule).next()
  target.setSeconds(10) //adding 10 seconds
  const timestamp = Math.floor(target.getTime()/1000)
  const toString = target.toISOString()
  const secondsLeft = Math.floor(timestamp - Date.now()/1000)
  return { timestamp, toString, secondsLeft }
}

//Event Subscription with Websock provider

let providerWs
let contractWs 
let result
const startEventSubscription = () => {


  const EXPECTED_PONG_BACK = 3*1000
  const KEEP_ALIVE_CHECK_INTERVAL = 60*1000
  const RESTART_WAIT = 1.5*1000

  providerWs = new ethers.WebSocketProvider(alchemyWs)
  contractWs = new ethers.Contract(contractAddr, contractAbi, providerWs)

  contractWs.on("*", async (event) => {
    result = event    
    const tx = await event.getTransaction()
    console.log('confirmations: ', await tx.confirmations())
    await tx.wait(5)
    console.log('confirmations: ', await tx.confirmations())
    //console.log(event)
    eventHandler(event)
    
  })  

  let pingTimeout = null
  let keepAliveInterval = null

  providerWs.websocket.on('open', () => {
    keepAliveInterval = setInterval(() => {
      console.log('Checking if the connection is alive, sending a ping')
      providerWs.websocket.ping()
      pingTimeout = setTimeout(() => {
        providerWs.websocket.terminate()
      }, EXPECTED_PONG_BACK)
    }, KEEP_ALIVE_CHECK_INTERVAL)
  })

  providerWs.websocket.on("error", async () => {
    console.log(`Unable to connect retrying in 3s...`);
    clearInterval(keepAliveInterval)
    clearTimeout(pingTimeout)
    contract.removeAllListeners()
    setTimeout(startEventSubscription, RESTART_WAIT);
  });

  providerWs.websocket.on('close', () => {
    console.log('The websocket connection was closed')

    clearInterval(keepAliveInterval)
    clearTimeout(pingTimeout)
    contract.removeAllListeners()
    setTimeout(startEventSubscription, RESTART_WAIT);
  })

  providerWs.websocket.on('pong', () => {
    console.log('Received pong, so connection is alive, clearing the timeout')
    clearInterval(pingTimeout)
  })
}

const eventHandler = async (e) => {
  const eventKey = `eventKey-${e.log.blockNumber}-${e.log.index}`
  console.log(eventKey)
  if (db.get(eventKey)) { return false }
  
  if (e.eventName == 'BallIssued') {

    await handler_BallIssued(e)

  } else if (e.eventName == 'CodeSeedRevealed') {

    handler_CodeSeedRevealed(e)

  } else if (e.eventName == 'RevealRequested') {

    handler_RevealRequested(e)
    
  } else if (e.eventName == 'SeasonStarted') {    

    console.log("new season started")

  } else if (e.eventName == 'SeasonEnded') {        

    console.log("The current season ended")

  } else if (e.eventName == 'WinnerPicked') {   

    console.log("The season winnerId Picked")

  } else {

  }
  db.put(eventKey, true)
}

const handler_BallIssued = async (e) => {

  //result = e

  const seasonId = Number(e.args.seasonId)
  const owner = e.args.recipient
  const qty = Number(e.args.qty)
  const endBallId = Number(e.args.endBallId)
  const startBallId = endBallId - qty + 1
  const code = 0
  const ownerSeasonKey = `owner-${owner}-${seasonId}`
  const ballList = new Set(db.get(ownerSeasonKey) || [])

  for (let i=startBallId; i <= endBallId; i++) {
    const ballKey = `ball-${i}`
    //console.log(ballKey)
    db.put(ballKey, {ballId: i, owner, seasonId, code }) 
    ballList.add(i)
  }
  db.put(ownerSeasonKey, Array.from(ballList.values()))

}

const handler_CodeSeedRevealed = async (e) => {
  const revealGroupId = e.args.revealGroupId
  const revealedSeed = await contract.revealGroupSeeds(revealGroupId)
  const ballIds = await contract.getBallsByRevealGroup(revealGroupId)
  for (let i=0; i <ballIds.length; i++) {
    const ballId = Number(ballIds[i])
    const ball = db.get(`ball-${ballId}`)
    if (ball.code <= 0) {
      ball.code = getCode(revealedSeed, ballId)
      db.put(`ball-${ballId}`, ball)
    }
  }
}

const handler_RevealRequested = async (e) => {
  const owner = e.args.requestor
  const seasonId = e.args.seasonId
  const endBallId = e.args.endBallId
  const myBalls = db.get(`owner-${owner}-${seasonId}`)
  console.log('ball length is ', myBalls.length)
  for (let i = 0; i < myBalls.length; i++) {
    const ballId = myBalls[i]
    const ball = db.get(`ball-${ballId}`)
    if (ball.code == 0 && ballId <= endBallId) {
      ball.code = -1
      db.put(`ball-${ballId}`, ball)
    } else if (ballId > endBallId) {
      return
    }
  }
}

const getCode = (seed, ballId) => {
  const codeInt = ethers.toBigInt(ethers.solidityPackedKeccak256(["uint256","uint32"], [seed, ballId]))
  let code = codeInt % 1000000n
  if (code < 100000n) { code += 100000n }
  return Number(code)
}

const downloadBalls = async (startBlock) => {
  if (!startBlock) startBlock = db.get('last-block')
  if (!startBlock) startBlock = 1
  const endBlock = await provider.getBlockNumber() - 1
  console.log('downloadBalls will process up to block# ', endBlock)

  const ballGroups = await contract.queryFilter('BallIssued', startBlock, endBlock)
  ballGroups.forEach(async group => {
    const eventKey = `eventKey-${group.blockNumber}-${group.index}`
    if (db.get(eventKey)) { return }

    await handler_BallIssued(group)

    db.put(eventKey, true)
  })

  await updateBallCodes(startBlock, endBlock);
  await updateRevealRequestPending(startBlock, endBlock)
  db.put('last-block', endBlock)
  return true
}

const updateBallCodes = async (startBlock, endBlock) => {
  const revealGroups = await contract.queryFilter('CodeSeedRevealed', startBlock, endBlock)
  revealGroups.forEach(async group => {
    const eventKey = `eventKey-${group.blockNumber}-${group.index}`
    if (db.get(eventKey)) { return }
    
    handler_CodeSeedRevealed(group)

    db.put(eventKey, true)
  })
}
const updateRevealRequestPending = async (startBlock, endBlock) => {
  const requestGroups = await contract.queryFilter('RevealRequested', startBlock, endBlock)
  requestGroups.forEach(async group => {
    const eventKey = `eventKey-${group.blockNumber}-${group.index}`
    console.log(eventKey)
    if (db.get(eventKey)) { return }
    
    handler_RevealRequested(group)

    db.put(eventKey, true)
  })  
}

module.exports = { 
  provider, 
  wallet, 
  contract, 
  downloadBalls, 
  updateBallCodes, 
  getUserBalls,
  getSeason,
  endSeason,
  relayRequestReveal,
  startSeason,
  issueBalls,
  getRelayData,
  isRevealNeededUser,
  requestRevealGroupSeed,
  startEventSubscription,
  nextRevealTime,
  splitSig
}

