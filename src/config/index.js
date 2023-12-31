const ethers = require('ethers')
const srcDir = require('find-config')('src')
//const sleep = require('util').promisify(setTimeout)
const { readMnemonic } = require(srcDir + '/keyman')
const db = require(srcDir + '/db')
const axios = require("axios");

require('dotenv').config({ path: require('find-config')('.env') })

const REVEAL_SCHEDULE = '* * * * *' //every 2 hour (even hour)
//const REVEAL_SCHEDULE = '0 */2 * * *' //every 2 hour (even hour)
const DOWNLOAD_SCHEDULE = '0/10 * * * *' //every 10 mintes

let networkId
let contractAddr
let alchemyApiKey
let provider
let wallet
let contract
let alchemyWs 
let providerWs
let contractWs 

if (process.env.OPERATION_MODE == 'production' ) {
  contractAddr = '0x93900f95839D1644420EEa9986A4464e5A03aa2F'
  networkId = 137
  alchemyApiKey = process.env.ALCHEMY_API_KEY_MAINET
  alchemyWs = "wss://polygon-mainnet.g.alchemy.com/v2/" + alchemyApiKey
} else if (process.env.OPERATION_MODE == 'development' ) {
  contractAddr = '0x93900f95839D1644420EEa9986A4464e5A03aa2F'
  networkId = 80001
  alchemyApiKey = process.env.ALCHEMY_API_KEY_MUMBAI
  alchemyWs = "wss://polygon-mumbai.g.alchemy.com/v2/" + alchemyApiKey
} else if (process.env.OPERATION_MODE == 'test' ){
  contractAddr = '0xAc9173B5B74307E3DA0C3cD51890F6542487265b'
  networkId = 31337 //hardhat
  //alchemyApiKey = process.env.ALCHEMY_API_KEY_MUMBAI
  //alchemyWs = "wss://polygon-mumbai.g.alchemy.com/v2/" + alchemyApiKey  
} else {
  throw('no process.env.OPERATION_MODE')
}

const contractAbi = [{"inputs":[{"internalType":"address","name":"have","type":"address"},{"internalType":"address","name":"want","type":"address"}],"name":"OnlyCoordinatorCanFulfill","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"seasonId","type":"uint16"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint32","name":"qty","type":"uint32"},{"indexed":false,"internalType":"uint32","name":"endBallId","type":"uint32"}],"name":"BallIssued","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"seasonId","type":"uint16"},{"indexed":false,"internalType":"uint32","name":"revealGroupId","type":"uint32"}],"name":"CodeSeedRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"OwnerTransfered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"seasonId","type":"uint16"},{"indexed":false,"internalType":"uint32","name":"revealGroupId","type":"uint32"},{"indexed":true,"internalType":"address","name":"requestor","type":"address"},{"indexed":false,"internalType":"uint32","name":"endBallId","type":"uint32"}],"name":"RevealRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"seasonId","type":"uint16"}],"name":"SeasonEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"seasonId","type":"uint16"}],"name":"SeasonStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"operator","type":"address"}],"name":"SetOperator","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint16","name":"seasonId","type":"uint16"},{"indexed":false,"internalType":"uint32","name":"ballId","type":"uint32"}],"name":"WinnerPicked","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ballCount","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ballGroups","outputs":[{"internalType":"uint32","name":"endBallId","type":"uint32"},{"internalType":"address","name":"owner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ballPosByRevealGroup","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"endSeason","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"ballId_","type":"uint32"}],"name":"getBallCode","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"ballId_","type":"uint32"}],"name":"getBallGroupPos","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalls","outputs":[{"internalType":"uint32[]","name":"","type":"uint32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint16","name":"seasonId","type":"uint16"}],"name":"getBalls","outputs":[{"internalType":"uint32[]","name":"","type":"uint32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"revealGroupId","type":"uint32"}],"name":"getBallsByRevealGroup","outputs":[{"internalType":"uint32[]","name":"","type":"uint32[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentBallGroupPos","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentRevealGroupId","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentSeasonId","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDomainInfo","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_deadline","type":"uint256"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"getEIP712Hash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOperator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRelayMessageTypes","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint32","name":"ballId_","type":"uint32"}],"name":"getRevealGroup","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint16","name":"seasonId_","type":"uint16"}],"name":"getUserBallCount","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint16","name":"seasonId","type":"uint16"}],"name":"getUserBallGroups","outputs":[{"internalType":"uint32[]","name":"","type":"uint32[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVersion","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint64","name":"_subscriptionId","type":"uint64"},{"internalType":"address","name":"_vrfCoordinator","type":"address"},{"internalType":"bytes32","name":"_keyHash","type":"bytes32"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isSeasonActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_tos","type":"address[]"},{"internalType":"uint32[]","name":"_qty","type":"uint32[]"}],"name":"issueBalls","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lastRequestId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint16","name":"","type":"uint16"}],"name":"newRevealPos","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"ballId_","type":"uint32"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"requestId","type":"uint256"},{"internalType":"uint256[]","name":"randomWords","type":"uint256[]"}],"name":"rawFulfillRandomWords","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"relayRequestReveal","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"users","type":"address[]"},{"internalType":"uint256[]","name":"deadlines","type":"uint256[]"},{"internalType":"uint8[]","name":"vs","type":"uint8[]"},{"internalType":"bytes32[]","name":"rs","type":"bytes32[]"},{"internalType":"bytes32[]","name":"ss","type":"bytes32[]"}],"name":"relayRequestRevealBatch","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"requestReveal","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"requestRevealGroupSeed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"}],"name":"revealGroupSeeds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"}],"name":"revealGroups","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"revealNeeded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"s_requests","outputs":[{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"bool","name":"isSeasonPick","type":"bool"},{"internalType":"uint256","name":"seed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"seasons","outputs":[{"internalType":"uint16","name":"seasonId","type":"uint16"},{"internalType":"uint32","name":"startBallId","type":"uint32"},{"internalType":"uint32","name":"endBallId","type":"uint32"},{"internalType":"uint32","name":"winningBallId","type":"uint32"},{"internalType":"uint32","name":"winningCode","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_newOperator","type":"address"}],"name":"setOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startSeason","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newOwner","type":"address"}],"name":"transferOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint16","name":"","type":"uint16"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userBallGroups","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_deadline","type":"uint256"},{"internalType":"uint256","name":"_nonce","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"verifySig","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
//const vrfAbi = [{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"acceptSubscriptionOwnerTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"consumer","type":"address"}],"name":"addConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"to","type":"address"}],"name":"cancelSubscription","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"createSubscription","outputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getRequestConfig","outputs":[{"internalType":"uint16","name":"","type":"uint16"},{"internalType":"uint32","name":"","type":"uint32"},{"internalType":"bytes32[]","name":"","type":"bytes32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"getSubscription","outputs":[{"internalType":"uint96","name":"balance","type":"uint96"},{"internalType":"uint64","name":"reqCount","type":"uint64"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address[]","name":"consumers","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"pendingRequestExists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"consumer","type":"address"}],"name":"removeConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"keyHash","type":"bytes32"},{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"uint16","name":"minimumRequestConfirmations","type":"uint16"},{"internalType":"uint32","name":"callbackGasLimit","type":"uint32"},{"internalType":"uint32","name":"numWords","type":"uint32"}],"name":"requestRandomWords","outputs":[{"internalType":"uint256","name":"requestId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"requestSubscriptionOwnerTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"}]
//const testWords = 'skin ride electric require nest run wagon nose ritual mammal fossil canyon'

const gasUrls = {
  137:  'https://gasstation.polygon.technology/v2', // Polygon Pos Mainet
  80001: 'https://gasstation-testnet.polygon.technology/v2' // Polygon Mumbai
}

const getFeeOption = async (networkId) => {
  const data =  (await axios(gasUrls[networkId])).data
  return {
    maxFeePerGas: ethers.parseUnits(Math.ceil(data.fast.maxFee + 1).toString(), 'gwei'),
    //maxPriorityFeePerGas: ethers.parseUnits(Math.ceil(data.standard.maxPriorityFee).toString(), 'gwei')
    maxPriorityFeePerGas: ethers.parseUnits(Math.ceil(data.fast.maxPriorityFee + 1).toString(), 'gwei')
  }
}

/*
const getFeeOption2 = async (networkId) => {
  const data =  (await axios(gasUrls[networkId])).data
  return {
    maxFeePerGas: ethers.parseUnits(Math.ceil(data.fast.maxFee + 1).toString(), 'gwei'),
    //maxPriorityFeePerGas: ethers.parseUnits(Math.ceil(data.standard.maxPriorityFee).toString(), 'gwei')
    maxPriorityFeePerGas: ethers.parseUnits(Math.ceil(data.fast.maxPriorityFee + 1).toString(), 'gwei')
  }
}
*/

if (process.env.OPERATION_MODE == 'test') {
  provider = new ethers.getDefaultProvider('http://localhost:8545')
} else {
  provider = new ethers.AlchemyProvider(networkId, alchemyApiKey)
  provider.getFeeData = async () => { return await getFeeOption(networkId) }
}
let  rawWallet = ethers.HDNodeWallet.fromPhrase(readMnemonic())
wallet = rawWallet.connect(provider)
contract = new ethers.Contract(contractAddr, contractAbi, wallet)

module.exports = {
  networkId,
  provider,
  wallet,
  contract,
  alchemyWs,
  providerWs,
  contractWs,
  contractAddr, 
  contractAbi,
  REVEAL_SCHEDULE,
  DOWNLOAD_SCHEDULE
}
