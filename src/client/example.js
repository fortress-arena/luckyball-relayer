const ethers = require('ethers')
const fetch = require('node-fetch') 
//npm install node-fetch@2

const user1 = ethers.Wallet.fromPhrase('skin ride electric require nest run wagon nose ritual mammal fossil canyon')
//'0x7BEABB9798B093B2A6246f1b748407C901Be5aeF'
const apiHost = 'https://gateway-ipfs.atomrigs.io/luckyball/api/'
//const apiHost = 'http://127.0.0.1:3001/luckyball/api/'

const dictToURI = (dict) => {
  const str = []
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]))
  }
  return str.join("&")
}
const apiGet = async (host, resource, data, accessToken) => {
  const headers = { 'Content-Type': 'application/json',
                   'Accept': 'application/json' 
                  }
  if (accessToken) {
    headers['Authorization'] = 'Bearer ' + accessToken
  }
  let url = host + resource
  if (data) {
    url = url + '?' + dictToURI(data)
  }
  console.log(url)
  const res = await fetch(url)
  return await res.json()
}

const apiPost = async (host, resource, data, accessToken) => {
  const headers = { 'Content-Type': 'application/json',
                   'Accept': 'application/json' 
                  }
  if (accessToken) {
    headers['Authorization'] = 'Bearer ' + accessToken
  }
  const url = host + resource
  const res =  await fetch(url, { method: 'post', headers: headers, 
    body: JSON.stringify(data) })
  return await res.json()
}

const getSeason = async () => {
  return await apiGet(apiHost, 'getSeason')
  /*
  https://gateway-ipfs.atomrigs.io/luckyball/api/getSeason
  {
    data: {
      seasonId: 1,
      startBallId: 1,
      endBallId: 0,
      winningBallId: 0,
      winningCode: 347065
    }
  }
  */
}

const getUserBalls = async () => {
  const data = {owner: user1.address} // current season data 
  //const data = {owner: user1.address, seasonId: 1} //for getting the old season data
  return await apiGet(apiHost, 'getUserBalls', data)
  /*
  https://gateway-ipfs.atomrigs.io/luckyball/api/getUserBalls?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF

  {"data":{"seasonId":1,"total":44,"unrevealCount":14,"revealPendingCount":0,"matchSum":[27,3,0,0,0,0,0],"seasonWinBallId":0,"isSeasonWin":false,
  "ballList":[[151,549003,0],[152,728774,1],[153,660518,0],[154,779147,0],[155,333613,0],[156,433725,0],[157,334998,0],[158,274857,0],
  [159,112867,0],[160,348573,0],[161,757014,1],[162,757326,0],[163,828618,0],[164,434583,0],[165,719918,0],[166,891574,1],[167,884807,0],
  [168,567633,0],[169,307997,0],[170,530117,0],[171,903220,0],[172,429573,0],[173,632666,0],[174,358080,0],[175,116371,0],[176,960550,0],
  [177,488515,0],[178,332382,0],[179,306741,0],[180,101479,0],[242,0,0],[244,0,0],[246,0,0],[248,0,0],[249,0,0],[250,0,0],[251,0,0],[252,0,0],
  [253,0,0],[254,0,0],[255,0,0],[256,0,0],[257,0,0],[258,0,0]]}}
  */
}

const getRelayData = async () => {
  const data = { owner: user1.address }
  return await apiGet(apiHost, 'getRelayData', data)

  /*
    https://gateway-ipfs.atomrigs.io/luckyball/api/getRelayData?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF

  {
    data: {
      domain: {
        name: 'LuckyBall_Relay',
        version: '1',
        chainId: 80001,
        verifyingContract: '0xd376ef3C423F318e83e52A3A74edb826d13505D6'
      },
      types: { Relay: [Array] },
      relayData: {
        owner: '0x7BEABB9798B093B2A6246f1b748407C901Be5aeF',
        deadline: 1688448572,
        nonce: 0
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

const generateRelaySig = async () => {
  const sigData = (await apiGet(apiHost, 'getRelayData', { owner: user1.address})).data
  //https://gateway-ipfs.atomrigs.io/luckyball/api/getRelayData?owner=0x7BEABB9798B093B2A6246f1b748407C901Be5aeF
  const rawSig = await user1.signTypedData(sigData.domain, sigData.types, sigData.relayData)
  const sig = splitSig(rawSig)
  return { owner: user1.address, 
           deadline: sigData.relayData.deadline,
           v: sig.v,
           r: sig.r,
           s: sig.s
  }
/*
  
  {
    owner: '0x7BEABB9798B093B2A6246f1b748407C901Be5aeF',
    deadline: 1688450758,
    v: 28,
    r: '0x14a62029d2b64ad89be3cdadf3450a53a963e0298cb68d758bdd41a5eb86f18a',
    s: '0x6b6befba500cef0475bb1c2b9d1f88264601ba7eca05828c07c5b187cf9a0a92'
  }
*/
}

const relayRequestReveal = async () => {
  const data = await generateRelaySig()
  return await apiPost(apiHost, 'relayRequestReveal', data)  
/*
  {
    data: {
      txid: '0x22053c310d9b63def5379d9c6f92949917a48e6ddb40c07f3e2fea6f804ae9db'
    }
  }
*/

}



