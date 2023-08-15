const jwt = require('jsonwebtoken')
require('dotenv').config({ path: require('find-config')('.env') })
const srcDir = require('find-config')('src')
const { readJwtPrivateKey, readJwtPublicKey } = require(srcDir + '/keyman')
const db = require(srcDir + '/db')
const JWT_EXP = 60*60

const generateAccessToken = (user, exp) => {
  exp = exp || JWT_EXP
  return jwt.sign(
    {
      user,
      isRefreshToken: false,
      exp: Math.floor(Date.now() / 1000) + exp
    },
    readJwtPrivateKey(),
    { algorithm: 'RS256' }
  )
}

const generateRefreshToken = (user, exp) => {
  exp = exp || 60*60*24*365
  return jwt.sign(
    {
      user,
      isRefreshToken: true,
      exp: Math.floor(Date.now() / 1000) + exp
    },
    readJwtPrivateKey(),
    { algorithm: 'RS256' }
  )
}

const verifyAccessToken = async (token) => {
  try {
    return await jwt.verify(token, readJwtPublicKey(), { algorithm: 'RS256' })
  } catch(err) {
    return { err: err.message }
  }
}

const protectedAccess = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] 
  if (token == null) return res.status(401).json({ err: 'No access token found'})
  const result = await verifyAccessToken(token)
  if (result.err) return res.status(401).json({ err: result.err })
  if (result.isRefreshToken) return res.status(401).json({ err: 'Refresh token is not allowed'})
  req.user = result.user
  req.isRefreshToken = result.isRefreshToken
  next()
}

const protectedRefresh = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] 
  if (token == null) return res.status(401).json({ err: 'No refresh token found'})
  const result = await verifyAccessToken(token)
  if (result.err) return res.status(401).json({ err: result.err })
  req.user = result.user
  req.isRefreshToken = result.isRefreshToken
  next()
}

module.exports = {
  generateRefreshToken,
  generateAccessToken,
  verifyAccessToken,
  protectedAccess,
  protectedRefresh
}