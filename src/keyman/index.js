const { JWKS, JWE } = require('jose')
const updateDotenv = require('update-dotenv')
require('dotenv').config({ path: require('find-config')('.env') })

const { generateKeyPairSync, createPublicKey } = require('crypto');
const jwt = require('jsonwebtoken');

//process.env.INFURA_API_KEY
//process.env.MNEMONIC_ENC

let keyStore 

if (process.env.KEY_STORE) {
  keyStore = JWKS.asKeyStore(JSON.parse(process.env.KEY_STORE))
} else {
  keyStore = new JWKS.KeyStore()
  keyStore.generateSync('RSA', 2048, {kid: 'encrypt'})
  updateDotenv({KEY_STORE: JSON.stringify(keyStore.toJWKS(true))})
}

const saveMnemonic = (mnemonic) => {
  const key = keyStore.get({ kid: 'encrypt' })
  const encryptedTxt = JWE.encrypt(mnemonic, key)
  updateDotenv({ MNEMONIC_ENC: encryptedTxt })
  return encryptedTxt
}

const readMnemonic = () => {
  const encryptedTxt = process.env.MNEMONIC_ENC
  const key = keyStore.get({ kid: 'encrypt' })
  return JWE.decrypt(encryptedTxt, key).toString()
}

const saveJwtPrivateKey = (jwtPrivateKey) => {
  const key = keyStore.get({ kid: 'encrypt' })
  const encryptedTxt = JWE.encrypt(jwtPrivateKey, key)
  updateDotenv({ JWT_PRIVATEKEY: encryptedTxt})
  return encryptedTxt
}

const readJwtPrivateKey = () => {
  const encryptedTxt = process.env.JWT_PRIVATEKEY
  const key = keyStore.get({ kid: 'encrypt' })
  return JWE.decrypt(encryptedTxt, key).toString()
}

const readJwtPublicKey = () => {
  const privateKey = readJwtPrivateKey()
  const pubKeyObj = createPublicKey({
    key: privateKey,
    format: 'pem'
  })
  return pubKeyObj.export({
    format: 'pem',
    type: 'spki'
  })
}

const genRSKeyPair = () => {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }    
  })
}

module.exports = { 
  readMnemonic, 
  readJwtPrivateKey,
  readJwtPublicKey
}

