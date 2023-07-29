const ethers = require('ethers')
const srcDir = require('find-config')('src')
require('dotenv').config({ path: require('find-config')('.env') })
const request = require('supertest')
const {describe, expect, test} = require("@jest/globals")
const app = require(srcDir + "/app")

let { networkId, provider, wallet, contract } = require(srcDir + '/config')


let vrfAddr = 0x199a57d10A5DF51dCaE02396dC0b910C6F47B6be

const vrfAbi = [{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"acceptSubscriptionOwnerTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"consumer","type":"address"}],"name":"addConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"to","type":"address"}],"name":"cancelSubscription","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"createSubscription","outputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getRequestConfig","outputs":[{"internalType":"uint16","name":"","type":"uint16"},{"internalType":"uint32","name":"","type":"uint32"},{"internalType":"bytes32[]","name":"","type":"bytes32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"getSubscription","outputs":[{"internalType":"uint96","name":"balance","type":"uint96"},{"internalType":"uint64","name":"reqCount","type":"uint64"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address[]","name":"consumers","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"}],"name":"pendingRequestExists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"consumer","type":"address"}],"name":"removeConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"keyHash","type":"bytes32"},{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"uint16","name":"minimumRequestConfirmations","type":"uint16"},{"internalType":"uint32","name":"callbackGasLimit","type":"uint32"},{"internalType":"uint32","name":"numWords","type":"uint32"}],"name":"requestRandomWords","outputs":[{"internalType":"uint256","name":"requestId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"subId","type":"uint64"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"requestSubscriptionOwnerTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"}]
//vrf = new ethers.Contract(vrfAddr, vrfAbi, wallet)

describe('Space test suite', () => {
  it('My Space Test', () => {
      expect(true).toEqual(true);
  });
});