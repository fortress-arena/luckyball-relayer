const ethers = require('ethers')
const srcDir = require('find-config')('src')
require('dotenv').config({ path: require('find-config')('.env') })
const { describe, expect, test } = require("@jest/globals")

const auth = require("../auth")
const main = require("../main")
const app = require(srcDir + "/app")
const request = require('supertest')(app)

let { networkId, provider, wallet, contract } = require(srcDir + '/config')

const refreshToken = auth.generateRefreshToken('tester')
const timeout = 100000

const user1 = ethers.Wallet.fromPhrase('skin ride electric require nest run wagon nose ritual mammal fossil canyon', provider)
//'0x7BEABB9798B093B2A6246f1b748407C901Be5aeF'


describe('Luckyball Relayer test > refresh/access token', () => {
  it('/ping should respond with poing', async() => {
    const response = await request
      .get("/luckyball/api/ping")
      .expect(200)
    expect(response.body).toEqual({ data: 'pong' })
  })

  it('/genAccessToken should return 401 error without refreshToken', async() => {
    const response = await request
      .post("/luckyball/api/genAccessToken")
      .expect(401)
  })

  it('/genAccessToken should return access Token with a valid refreshtoken', async() => {
    const response = await request
      .post("/luckyball/api/genAccessToken")
      .set('Authorization', 'bearer ' + refreshToken)
      .expect(200)
    expect(response.body.data.substr(0,2)).toBe('ey')
  })

})

describe('Luckyball Relayer test >  main functions', () => {

  let seasonActive
  let accessToken

  beforeAll(() => {

    return (async () => {
      seasonActive = (await request
      .get("/luckyball/api/getSeason")).body.data.isActive

      console.log('current season is ', seasonActive)

      accessToken = (await request
        .post("/luckyball/api/genAccessToken")
        .set('Authorization', 'bearer ' + refreshToken)).body.data    
  
      await main.downloadBalls()
      if (!seasonActive) {
          const response2 = await request
          .post("/luckyball/api/startSeason")
          .set('Authorization', 'bearer ' + accessToken)
          .set('Content-Type', 'application/json')
        const txid = response2.body.data.txid
        console.log(txid)
        //await new Promise(resolve => setTimeout(resolve, 7000))
        await provider.waitForTransaction(txid, confirms = 3)
        seasonActive = true
      }
    })()    
  }, timeout)

  afterAll(() => {

    return (async () => {
      seasonActive = (await request
        .get("/luckyball/api/getSeason")).body.data.isActive
      if (seasonActive) {
        const response = await request
        .post("/luckyball/api/endSeason")
        .set('Authorization', 'bearer ' + accessToken)
        .set('Content-Type', 'application/json')
        //.expect(200)
        console.log(response.body)
        const txid = response.body.data.txid
        console.log(txid)
        //await new Promise(resolve => setTimeout(resolve, 5000))
        await provider.waitForTransaction(txid, confirms = 3)
        console.log('season Ended')        
      }
    })()
  }, timeout)    

  it('/getSeason should provide season info', async() => {
    const response = await request
      .get("/luckyball/api/getSeason")
      .expect(200)
    season = response.body.data
    //console.log('season ', season )
  })

  it('/issueBalls should issue balls if season is active', async() => {
    const response = await request
      .post("/luckyball/api/issueBalls")
      .set('Authorization', 'bearer ' + accessToken)
      .set('Content-Type', 'application/json')
      .send({ addrList: [user1.address], qtyList: [10] })
      .expect(200)
      const txid = response.body.data.txid
      //console.log('issueball txid is ', txid)
      //const receipt1 = await provider.waitForTransaction(txid, 3)
      //console.log('issueBalls at ', receipt1.blockNumber)
      await provider.waitForTransaction(txid, confirms = 3)
      //await new Promise(resolve => setTimeout(resolve, 7000))
      await main.downloadBalls()

      const response2 = await request
        .get("/luckyball/api/getUserBalls")
        .query({ owner: user1.address })
        .set('Content-Type', 'application/json')
        .expect(200)
      //console.log(response2.body)            
      user1.connect(provider)
      await contract.connect(user1).requestReveal()

  }, timeout) 

  it('/relayRequestReveal should work', async() => {
    const response = await request
      .post("/luckyball/api/issueBalls")
      .set('Authorization', 'bearer ' + accessToken)
      .set('Content-Type', 'application/json')
      .send({ addrList: [user1.address], qtyList: [10] })
      .expect(200)
      const txid = response.body.data.txid
      //console.log(txid)
      const receipt1 = await provider.waitForTransaction(txid, 3)
      //console.log('issueBalls at ', receipt1.blockNumber)
      
      await main.downloadBalls()

      const response2 = await request
        .get("/luckyball/api/getRelayData")
        .query({ owner: user1.address })
        .set('Content-Type', 'application/json')
        .expect(200)
      //console.log(response2.body.data)            
      const data = response2.body.data
      const rawSig = await user1.signTypedData(data.domain, data.types, data.relayData)
      const sig = main.splitSig(rawSig)

    const response3 = await request
      .post("/luckyball/api/relayRequestReveal")
      .set('Authorization', 'bearer ' + accessToken)
      .set('Content-Type', 'application/json')
      .send({ 
        owner: user1.address,
        deadline: data.relayData.deadline,
        v: sig.v,
        r: sig.r,
        s: sig.s
      })
      .expect(200)      
      //console.log(response3.body.data)   
  }, timeout) 
  
  it('/issueBalls with multipe addresses', async() => {
    const response = await request
      .post("/luckyball/api/issueBalls")
      .set('Authorization', 'bearer ' + accessToken)
      .set('Content-Type', 'application/json')
      .send({ addrList: Array(100).fill(user1.address), qtyList: Array(100).fill(100) })
      .expect(200)
      const txid = response.body.data.txid
      console.log(txid)
      const receipt1 = await provider.waitForTransaction(txid, 3)
      console.log('issueBalls at ', receipt1.blockNumber)
      
  }, timeout)
})