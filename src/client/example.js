const fetch = require('node-fetch') 
//npm install node-fetch@2

const apiHost = 'https://gateway-ipfs.atomrigs.io/luckyball/api/'
const user1 = '0x7BEABB9798B093B2A6246f1b748407C901Be5aeF'

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
  const data = {owner: user1} // current season data 
  //const data = {owner: '', seasonId: 1} //for getting the old season data
  return await apiGet(apiHost, 'getUserBalls', data)

}


