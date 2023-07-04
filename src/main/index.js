const ethers = require('ethers')
const srcDir = require('find-config')('src')
//const sleep = require('util').promisify(setTimeout)
const { readMnemonic } = require(srcDir + '/keyman')
const db = require(srcDir + '/db')

require('dotenv').config({ path: require('find-config')('.env') })

//const defaultPath = "m/44'/60'/0'/0/0"
const contractAddr = '0xd376ef3C423F318e83e52A3A74edb826d13505D6'
const contractAbi = [{"inputs":[{"internalType":"uint64","name":"subscriptionId","type":"uint64"},{"internalType":"address","name":"vrfCoordinator","type":"address"},{"internalType":"bytes32","name":"keyHash","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"have","type":"address"},{"internalType":"address","name":"want","type":"address"}],"name":"OnlyCoordinatorCanFulfill","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seasonId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"qty","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"lastBallId","type":"uint256"}],"name":"BallIssued","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seasonId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"revealGroupId","type":"uint256"}],"name":"CodeSeedRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seasonId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"revealGroupId","type":"uint256"},{"indexed":true,"internalType":"address","name":"requestor","type":"address"}],"name":"RevealRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seasonId","type":"uint256"}],"name":"SeasonEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"seasonId","type":"uint256"}],"name":"SeasonStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"seasonId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"ballId","type":"uint256"}],"name":"WinnerPicked","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"addrGroups","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ballCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ballGroups","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ballPosByRevealGroup","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"endSeason","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"ballId","type":"uint256"}],"name":"getBallCode","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"ballId","type":"uint256"}],"name":"getBallGroupPos","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalls","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"seasonId","type":"uint256"}],"name":"getBalls","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"revealGroupId","type":"uint256"}],"name":"getBallsByRevealGroup","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBallGroupPos","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentRevealGroupId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentSeasonId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDomainInfo","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_deadline","type":"uint256"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"getEIP712Hash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOperator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRelayMessageTypes","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"ballId","type":"uint256"}],"name":"getRevealGroup","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"seasonId","type":"uint256"}],"name":"getUserBallGroups","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isSeasonActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_tos","type":"address[]"},{"internalType":"uint256[]","name":"_qty","type":"uint256[]"}],"name":"issueBalls","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lastRequestId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"newRevealPos","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"ballId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"requestId","type":"uint256"},{"internalType":"uint256[]","name":"randomWords","type":"uint256[]"}],"name":"rawFulfillRandomWords","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"relayRequestReveal","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"users","type":"address[]"},{"internalType":"uint256[]","name":"deadlines","type":"uint256[]"},{"internalType":"uint8[]","name":"vs","type":"uint8[]"},{"internalType":"bytes32[]","name":"rs","type":"bytes32[]"},{"internalType":"bytes32[]","name":"ss","type":"bytes32[]"}],"name":"relayRequestRevealBatch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"requestReveal","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"requestRevealGroupSeed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"revealGroupSeeds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"revealGroups","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"revealNeeded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"s_requests","outputs":[{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"bool","name":"isSeasonPick","type":"bool"},{"internalType":"uint256","name":"seed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"seasons","outputs":[{"internalType":"uint256","name":"seasonId","type":"uint256"},{"internalType":"uint256","name":"startBallId","type":"uint256"},{"internalType":"uint256","name":"endBallId","type":"uint256"},{"internalType":"uint256","name":"winningBallId","type":"uint256"},{"internalType":"uint256","name":"winningCode","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_newOperator","type":"address"}],"name":"setOperator","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startSeason","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userBallCounts","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userBallGroups","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_deadline","type":"uint256"},{"internalType":"uint256","name":"_nonce","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"verifySig","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
const networkId = 80001
const alchemyApiKey = process.env.ALCHEMY_API_KEY
let provider
let wallet
let contract

const getContract = async () => {
  provider = new ethers.AlchemyProvider(networkId, alchemyApiKey)
  let  rawWallet = ethers.HDNodeWallet.fromPhrase(readMnemonic())
  wallet = rawWallet.connect(provider)
  contract = new ethers.Contract(contractAddr, contractAbi, wallet)
  return provider, wallet, contract
}

(async () => {
  try {
    await getContract()
  } catch (err) {
    console.log(err)
  }
})()

const dbReset = () => {
  db.put('last-block', 1)
}

const getCode = (seed, ballId) => {
  const codeInt = ethers.toBigInt(ethers.solidityPackedKeccak256(["uint256","uint256"], [seed, ballId]))
  let code = codeInt % 1000000n
  if (code < 100000n) { code += 100000n }
  return Number(code)
}
 
const downloadBalls = async (startBlock) => {
  if (!startBlock) startBlock = db.get('last-block')
  if (!startBlock) startBlock = 1
  let endBlock = await provider.getBlockNumber()
  console.log('downloadBalls will process up to block# ', endBlock)
  let ballList = new Set(db.get('ownerSeasonKey') || [])
  let ballGroups = await contract.queryFilter('BallIssued', startBlock, endBlock)
  ballGroups.forEach(group => {
    let seasonId = Number(group.args.seasonId)
    let owner = group.args.recipient
    let qty = Number(group.args.qty)
    let lastBallId = Number(group.args.lastBallId)
    let startBallId = lastBallId - qty + 1
    let code = 0
    let ownerSeasonKey = `owner-${owner}-${seasonId}`
    //console.log(ownerSeasonKey)
    //console.log(startBallId)
    //console.log(lastBallId)
 
    for (i=startBallId; i <= lastBallId; i++) {
      let ballKey = `ball-${i}`
      console.log(ballKey)
      db.put(ballKey, {ballId: i, owner, seasonId, code }) 
      ballList.add(i)
    }
    db.put(ownerSeasonKey, Array.from(ballList.values()))
  })
  await updateBallCodes(startBlock, endBlock);
  db.put('last-block', endBlock)
  return 
}

const updateBallCodes = async (startBlock, endBlock) => {
  const revealGroups = await contract.queryFilter('CodeSeedRevealed', startBlock, endBlock)
  revealGroups.forEach(async group => {
    const revealGroupId = group.args.revealGroupId
    const revealedSeed = await contract.revealGroupSeeds(revealGroupId)
    const ballIds = await contract.getBallsByRevealGroup(revealGroupId)
    for (i=0; i<ballIds.length; i++) {
      const ballId = Number(ballIds[i])
      const ball = db.get(`ball-${ballId}`)
      ball.code = getCode(revealedSeed, ballId)
      db.put(`ball-${ballId}`, ball)
    }
    return ballIds.length
  })
}

const getSig = async () => {

}

const getFeeOption = async () => {
  const feeData =  await provider.getFeeData()
  const maxFeePerGas = feeData.maxFeePerGas + ethers.parseUnits('5', 'gwei')
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas + ethers.parseUnits('3', 'gwei')
  return { maxFeePerGas, maxPriorityFeePerGas }
}
const relayRequestReveal = async (owner, deadline, v, r, s) => {
  const feeOption = await getFeeOption()
  return (await contract.relayRequestReveal(owner, deadline, v, r, s, feeOption)).hash
}

const getCurrentSeasonId = async () => {  
  return Number(await contract.getCurrentSeasonId())
}

const getSeason = async (seasonId) => {
  seasonId = seasonId || await getCurrentSeasonId()
  const data = await contract.seasons(seasonId)
  const startBallId = Number(data[1])
  const endBallId = Number(data[2])
  const winningBallId = Number(data[3])
  const winningCode = Number(data[4])
  return { seasonId, startBallId, endBallId, winningBallId, winningCode }
}

const getUserBalls = async (userAddr, seasonId) => {
  seasonId = seasonId || await getCurrentSeasonId()
  const season = await contract.seasons(seasonId)
  const seasonWiningCode = Number(season[4])
  const seasonWinningId = Number(season[3])

  const key = `owner-${userAddr}-${seasonId}`
  const ballIds = db.get(key)
  if (!ballIds) return []

  const ballList = []
  let total = ballIds.length
  let matchSum = [0,0,0,0,0,0,0]
  let seasonWin = 0

  for (let i=0; i < ballIds.length; i++) {
    let ballId = ballIds[i]
    if (seasonWinningId > 0 && ballId == seasonWinningId) {
      seasonWin = ballId
    }
    let ballData = db.get(`ball-${ballId}`)
    let matchCount = compareCodes(ballData.code, seasonWiningCode)
    matchSum[matchCount] += 1
    ballList.push({ballId, code: ballData.code, matchCount})
  }

  return { matchSum, seasonWin, ballList }
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
  return (await contract.startSeason()).hash
  //const seasonId = await contract.getCurrentSeasonId()
  //return seasonId
}

const issueBalls = async (addrList, qtyList) => {
  const txid = (await contract.issueBalls(addrList, qtyList)).hash
  //downloadBalls()
  return txid
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

const isRevealNeeded = async (address) => {
  const seansonId = await contract.getCurrentSeasonId()
  const myGroups = await contract.getUserBallGroups(address, seansonId)
  if (myGroups.length == 0) {
    return false
  }
  const newPos = await contract.newRevealPos(address)
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
  const feeOption = await getFeeOption()
  const txid = (await contract.requestRevealGroupSeed(feeOption)).hash
  //downloadBalls()
  console.log('requestRevealGroupSeed is executed ', txid)
  return txid
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

const testWords = 'skin ride electric require nest run wagon nose ritual mammal fossil canyon'

const returnWallet = () => {
  return wallet
}

module.exports = { 
  provider, 
  wallet, 
  contract, 
  downloadBalls, 
  updateBallCodes, 
  getUserBalls,
  getSeason,
  relayRequestReveal,
  startSeason,
  issueBalls,
  getRelayData,
  isRevealNeeded,
  returnWallet,
  requestRevealGroupSeed
}