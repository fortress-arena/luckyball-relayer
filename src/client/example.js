const ethers = require('ethers')
const e = require('express')
const fetch = require('node-fetch') 
//npm install node-fetch@2

const user1 = ethers.Wallet.fromPhrase('skin ride electric require nest run wagon nose ritual mammal fossil canyon')
//'0x7BEABB9798B093B2A6246f1b748407C901Be5aeF'
const apiHost = 'https://gateway-ipfs.atomrigs.io/luckyball/api/'

const dictToURI = (dict) => {
  const str = [];
  for(var p in dict){
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
  }
  return str.join("&");
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
  const url = host + resource;
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
  {
    data: [
      { ballId: 1, code: 0, matchCount: 0 },
      { ballId: 2, code: 0, matchCount: 0 },
      { ballId: 3, code: 0, matchCount: 0 },
      { ballId: 4, code: 0, matchCount: 0 },
      { ballId: 5, code: 0, matchCount: 0 },
      { ballId: 6, code: 0, matchCount: 0 },
      { ballId: 7, code: 0, matchCount: 0 },
      { ballId: 8, code: 0, matchCount: 0 },
      { ballId: 9, code: 0, matchCount: 0 },
      { ballId: 10, code: 0, matchCount: 0 }
    ]
  }
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
    sig = sig.substring(2);
  }
  return {r: "0x" + sig.slice(0, 64), s: "0x" + sig.slice(64, 128), v: parseInt(sig.slice(128, 130), 16)};
}

const generateRelaySig = async () => {
  const sigData = (await apiGet(apiHost, 'getRelayData', { owner: user1.address})).data
  return sigData
  const rawSig = user1.signTypedData(sigData.domain, sigData.types, sigData.relayData)
  const sig = splitSig(rawSig)
  return { owner: user1.address, 
           deadline: sigData.relayData.deadline,
           v: sig.v,
           r: sig.r,
           s: sig.s
  }
}

const relayRequestReveal = async () => {
  const data = generateRelaySig()
  return await apiPost(apiHost, 'getRelayData', data)  
}



