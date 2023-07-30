const ethers = require('ethers')
const { access } = require('fs')
const fetch = require('node-fetch') 
//npm install node-fetch@2

const user1 = ethers.Wallet.fromPhrase('skin ride electric require nest run wagon nose ritual mammal fossil canyon')
//'0x7BEABB9798B093B2A6246f1b748407C901Be5aeF'
const apiHost = 'https://gateway-ipfs.atomrigs.io/luckyball/api/'
//const apiHost = 'http://127.0.0.1:3001/luckyball/api/'
const REFRESH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdGVyIiwiaXNSZWZyZXNoVG9rZW4iOnRydWUsImV4cCI6MTcyMjIxNDgzOSwiaWF0IjoxNjkwNjc4ODM5fQ.iyJlxTzrqejL0O_IL_OUdheFOljPVvJXI432mUXQ1BKA_8I9-VpWp_B7a1XF7RxZXIRcREyj76o_sL7b_65eHKPTDDj5wjxcgX-VEhaPBRX5CMyy84FUgZe3dkOuXOf8fg45XHqMjEX3MelN7UnIQY4n8HwTQZfxwUBl7ShXYBBpqzWHQAEiM8d_zLPwYpFdIlQyfiCrBEo7oWku_mPCaDAGolkJiQAVqwK9jpzrroLr40H8fQVuKybjcmgRKo150VmYolHa6wwxeMkVO6Ji0lsvogeVKcMRiu-KruuAMhGwCQEd109Py_Y2vO42BJbABW080bWQVHnXS_OdsNjbIQ"

const dictToURI = (dict) => {
  const str = []
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]))
  }
  return str.join("&")
}

const apiCall = async (host, method, resource, data, accessToken) => {
  let headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken  
  let url = host + resource
  let body = null
  if (method == 'get') {
    if (data) {
      url = url + '?' + dictToURI(data)
    }
    console.log(url)
  } else if (method == 'post') {
    if (data) body = JSON.stringify(data)
  } else {
    throw('not supported yet')
  }
  const res =  await fetch(url, { method , headers, body })
  return await res.json()
}

const getSeason = async (seasonId) => {
  if (seasonId) {
    return await apiGet(apiHost, 'getSeason', { seasonId })
  } else {
    return await apiGet(apiHost, 'getSeason')
  }
  /*
  await getSeason()
  http://127.0.0.1:3001/luckyball/api/getSeason

  OR
  await getSeason(1)
  http://127.0.0.1:3001/luckyball/api/getSeason?seasonId=1

  RETURNS
  {
    data: {
      seasonId: 1,
      seasonBallCount: 40,
      startBallId: 1,
      endBallId: 40,
      winningBallId: 0,
      winningCode: 151391,
      isActive: true
    }
  }
  */
}

const getUserBalls = async (owner, seasonId) => {
  owner = owner ||  user1.address
  let data = { owner } // current season data 
  if (seasonId) {
    data[seasonId] = seasonId
  }
  return await apiCall(apiHost, 'get', 'getUserBalls', data)
  /*
  await getUserBalls('0x7BEABB9798B093B2A6246f1b748407C901Be5aeF')
  http://127.0.0.1:3001/luckyball/api/getUserBalls?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF

  or 
  await getUserBalls('0x7BEABB9798B093B2A6246f1b748407C901Be5aeF', 1)
  http://127.0.0.1:3001/luckyball/api/getUserBalls?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF&seasonId=1

  RETURNS
  {"data":{"seasonId":1,"total":44,"unrevealCount":14,"revealPendingCount":0,"matchSum":[27,3,0,0,0,0,0],"seasonWinBallId":0,"isSeasonWin":false,
  "ballList":[[151,549003,0],[152,728774,1],[153,660518,0],[154,779147,0],[155,333613,0],[156,433725,0],[157,334998,0],[158,274857,0],
  [159,112867,0],[160,348573,0],[161,757014,1],[162,757326,0],[163,828618,0],[164,434583,0],[165,719918,0],[166,891574,1],[167,884807,0],
  [168,567633,0],[169,307997,0],[170,530117,0],[171,903220,0],[172,429573,0],[173,632666,0],[174,358080,0],[175,116371,0],[176,960550,0],
  [177,488515,0],[178,332382,0],[179,306741,0],[180,101479,0],[242,0,0],[244,0,0],[246,0,0],[248,0,0],[249,0,0],[250,0,0],[251,0,0],[252,0,0],
  [253,0,0],[254,0,0],[255,0,0],[256,0,0],[257,0,0],[258,0,0]]}}

  //
  total = unrevealCount + revealPendingCount + sum(matchSum)
  
  matchSum":[27,3,0,0,0,0,0] ==>
  no ball match : 27
  1 ball match: 3
  2 ball match: 0
  .....

  */
}

const getRelayData = async (owner) => {
  owner = owner || user1.address
  const data = { owner }
  return await apiCall(apiHost, 'get', 'getRelayData', data)

  /*

  await getRelayData('0x7BEABB9798B093B2A6246f1b748407C901Be5aeF')
  http://127.0.0.1:3001/luckyball/api/getRelayData?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF

  RETURNS
  {
    data: {
      domain: {
        name: 'LuckyBall_Relay',
        version: '1',
        chainId: 80001,
        verifyingContract: '0x93900f95839D1644420EEa9986A4464e5A03aa2F'
      },
      types: { Relay: [Array] },
      relayData: {
        owner: '0x7BEABB9798B093B2A6246f1b748407C901Be5aeF',
        deadline: 1690764041,
        nonce: 1
      }
    }
  }
  */
}

const splitSig = (sig) => {
  if (sig.startsWith("0x")) {
    sig = sig.substring(2)
  }
  return {r: "0x" + sig.slice(0, 64), s: "0x" + sig.slice(64, 128), v: parseInt(sig.slice(128, 130), 16)}
}

const generateRelaySig = async (wallet) => {
  wallet = wallet || user1
  const sigData = (await apiCall(apiHost, 'get', 'getRelayData', { owner: wallet.address })).data
  const rawSig = await wallet.signTypedData(sigData.domain, sigData.types, sigData.relayData)
  const sig = splitSig(rawSig)
  return { owner: wallet.address, 
           deadline: sigData.relayData.deadline,
           v: sig.v,
           r: sig.r,
           s: sig.s
  }
/*
  await generateRelaySig(user1)

  RETURNS
  {
    owner: '0x7BEABB9798B093B2A6246f1b748407C901Be5aeF',
    deadline: 1688450758,
    v: 28,
    r: '0x14a62029d2b64ad89be3cdadf3450a53a963e0298cb68d758bdd41a5eb86f18a',
    s: '0x6b6befba500cef0475bb1c2b9d1f88264601ba7eca05828c07c5b187cf9a0a92'
  }
*/
}

const relayRequestReveal = async (wallet) => {
  wallet = wallet || user1
  const data = await generateRelaySig(wallet)
  return await apiCall(apiHost, 'post', 'relayRequestReveal', data)  
/*
  await relayRequestReveal(user1)

  RETURNS
  {
    data: {
      txid: '0x22053c310d9b63def5379d9c6f92949917a48e6ddb40c07f3e2fea6f804ae9db'
    }
  }
*/
}

/**
 * Operator Functions
 * 
 */

const genAccessToken = async (refreshToken) => {
  //refreshToken = refreshToken || REFRESH_TOKEN
  return await apiCall(apiHost, 'post', 'genAccessToken', null , refreshToken)

  /*
  await genAccessToken(REFRESH_TOKEN)    

  RETURNS
  {
    data: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdGVyIiwiaXNSZWZyZXNoVG9rZW4iOmZhbHNlLCJleHAiOjE2OTA2ODM5MzgsImlhdCI6MTY5MDY4MDMzOH0.C2pWyMhJtnhz1ZtdCYcE-bsgEF-kG5lQcv9g0Ab4mWW1_HzCEVGypwEZgbyUz1r-moQeFSqbbvesQ5i6KFnfGg_pZEKQJZhgiI6ebdALKmZel2wJlKMuPJkGbLNSjVi8YC9dZeEX09d-LlJSFja49YmjaMakb5hPEFDvfWDfD4pcgmv8VFMylUqj4N-qZgYGFFNv8tDJh1NnWRPGw0O3uOqs6tptzFlg3b3v0B8qpnZup-kiUsCwtXDlDc-0k_UJ4YRCeVFlZ4On7g6Lhd3dHcveUPTFYIT7CeYEW6TXTxO2sKD0iU9aL2td_rQ_5IMsGrh-K0Cc8Hos-XjZWj6fVw'
  }

  */
}

const startSeason = async (refreshToken) => {
  const accessToken = (await genAccessToken(refreshToken)).data
  return await apiCall(apiHost, 'post', 'startSeason', null, accessToken)
  /*
  await startSeason(REFRESH_TOKEN)

  RETURNS
  {
    data: {
      txid: '0x72ccbb79fdf166c63d42e77acaa043c5af10df7e3c4d3cace0bb682677609949'
    }
  }  
  */

}

const endSeason = async(refreshToken) => {
  const accessToken = (await genAccessToken(refreshToken)).data
  return await apiCall(apiHost, 'post', 'endSeason', null, accessToken)

  /*
  await endSeason(REFRESH_TOKEN)

  RETURNS
  {
    data: {
      txid: '0x1d41a59f4cb1d578bae28798f7aa24c56f72de2f762e7102f5f5713fbd373e41'
    }
  }
  */
}

const issueBalls = async(addrList, qtyList, refreshToken) => {
  const accessToken = (await genAccessToken(refreshToken)).data
  const data = { addrList, qtyList }
  return await apiCall(apiHost, 'post', 'issueBalls', data, accessToken )
  /*
  await issueBalls(["0x7BEABB9798B093B2A6246f1b748407C901Be5aeF","0x28cbb23A737E8562E7A446804b0D2458e1A3D0A7"], 
                  [20,20], REFRESH_TOKEN)

  Returns 
  {
    data: {
      txid: '0x52f667ce81eb94ae4a823bc94fb5a13bacb2d2b547241325c42a2af272952f50'
    }
  }  
  */
}

const requestRevealGroupSeed = async(refreshToken) => {
  const accessToken = (await genAccessToken(refreshToken)).data
  return await apiCall(apiHost, 'post', 'requestRevealGroupSeed', null, accessToken )

  /*
  await requestRevealGroupSeed(refreshToken)

  RETURNS
  {
    data: {
      txid: '0xd74cfaeb4ec7dbe6c7b49e9b59c32abc42d4a9f39d1f63e8b1ed689fce59cbd2'
    }
  }
  */
}


