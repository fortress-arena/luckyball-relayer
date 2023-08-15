const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const Dynamo = require("@aws-sdk/client-dynamodb")
require("dotenv").config({ path: require("find-config")(".env") })

//const accessKey = process.env.AWS_ACCESSKEY
//const secretKey = process.env.AWS_SECRETKEY

const ddb = new DynamoDB({ 
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY,
    secretAccessKey: process.env.AWS_SECRETKEY
  }       
})

const table_luckyball_balls = {
  AttributeDefinitions: [
    {
      AttributeName: "ballId",
      AttributeType: "S"
    },
    {
      AttributeName: "ownerAddr",
      AttributeType: "S"
    },
    {
      AttributeName: "seasonId",
      AttributeType: "S"
    },
  ],
  KeySchema: [
    {
      AttributeName: "ballId",
      KeyType: "HASH"
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "owner_seasonId",
      KeySchema: [
        {
          AttributeName: "ownerAddr",
          KeyType: "HASH"
        },
        {
          AttributeName: "seasonId",
          KeyType: "RANGE"
        }
      ],
      Projection: { ProjectionType: "ALL" },
    }
  ],
  TableName: "LUCKYBALL_BALLS",
  BillingMode: "PAY_PER_REQUEST",
  DeletionProtectionEnabled: false
};

const table_luckyball_events = {
    "AttributeDefinitions": [
      {
        "AttributeName": "eventKey",
        "AttributeType": "S"
      }
  ],
  "TableName": "LUCKYBALL_EVENT",
  "KeySchema": [
      {
        "AttributeName": "eventKey",
        "KeyType": "HASH"
      }
  ],
  BillingMode: "PAY_PER_REQUEST",
  DeletionProtectionEnabled: false
}


const createTable = async (tableParams) => {
  try {
    const result = await ddb.createTable(tableParams);
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

const deleteTable = async (tableName) => {
  try {
    const result = await ddb.deleteTable({ TableName: tableName });
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

/**
 * 
 * @param {Object} ball 
 * @param {number} ball.ballId
 * @param {string} ball.ownerAddr
 * @param {number} ball.seasonId
 * @param {number} ball.code
 */
const putBall = async (ball) => {
  const params = {
    TableName: "LUCKYBALL_BALLS",
    Item: {
      "ballId": {
        "S": `${ball.ballId}` 
      },
      "ownerAddr": {
        "S": ball.ownerAddr
      },
      "seasonId": {
        "S": `${ball.seasonId}`
      },
      "code": {
        "S": `${ball.code}`
      }
    },
    ReturnConsumedCapacity: "TOTAL"
  }
  try {
    const result = await ddb.putItem(params)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

const putBallBatch = async (balls) => {
  const params = {
    RequestItems: {
      "LUCKYBALL_BALLS": balls.map(ball => {
        return {
          PutRequest: {
            Item: {
              "ballId": {
                "S": `${ball.ballId}` 
              },
              "ownerAddr": {
                "S": ball.ownerAddr
              },
              "seasonId": {
                "S": `${ball.seasonId}`
              },
              "code": {
                "S": `${ball.code}`
              }
            }
          }
        }
      })
    }
  }
  try {
    const result = await ddb.batchWriteItem(params)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

/**
 * 
 * @param {number} ballId 
 * @returns {object} ball
 */
const getBall = async (ballId) => {
  const params = {
    TableName: "LUCKYBALL_BALLS",
    Key: {
      "ballId": {
        "S": `${ballId}`
      }
    }
  }
  try {
    const _ball = (await ddb.getItem(params)).Item
    if (!_ball) return null
    return {
      "ballId": Number(_ball.ballId.S),
      "ownerAddr": _ball.ownerAddr.S,
      "seasonId": Number(_ball.seasonId.S),
      "code": Number(_ball.code.S)
    }
  } catch (err) {
    console.error(err);
  }
}

/*
const getUserBalls = async (ownerAddr, seasonId) => {
  const params = {
    TableName: "LUCKYBALL_BALLS",
    IndexName: "owner_seasonId",
    KeyConditionExpression: "ownerAddr = :ownerAddr and seasonId = :seasonId",
    ExpressionAttributeValues: {
      ":ownerAddr": { "S": ownerAddr },
      ":seasonId": { "S": `${seasonId}` }
    }
  }
  try {
    const result = (await ddb.query(params)).Items
    return result.map(ball => {
      return {
        "ballId": Number(ball.ballId.S),
        "ownerAddr": ball.ownerAddr.S,
        "seasonId": Number(ball.seasonId.S),
        "code": Number(ball.code.S)
      }
    })
  } catch (err) {
    console.error(err);
  }
}
*/

const getUserBalls = async (ownerAddr, seasonId, limit, lastEvaluatedKey) => {
  const params = {
    TableName: "LUCKYBALL_BALLS",
    IndexName: "owner_seasonId",
    KeyConditionExpression: "ownerAddr = :ownerAddr and seasonId = :seasonId",
    ExpressionAttributeValues: {
      ":ownerAddr": { "S": ownerAddr },
      ":seasonId": { "S": `${seasonId}` }
    },
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey
  }
  try {
    const result = (await ddb.query(params)).Items
    return result.map(ball => {
      return {
        "ballId": Number(ball.ballId.S),
        "ownerAddr": ball.ownerAddr.S,
        "seasonId": Number(ball.seasonId.S),
        "code": Number(ball.code.S)
      }
    })
  } catch (err) {
    console.error(err)
  }
}

const putEvent = async (eventKey, eventValue) => {
  const params = {
    TableName: "LUCKYBALL_EVENT",
    Item: {
      "eventKey": {
        "S": `${eventKey}`
      },
      "eventValue": {
        "S": JSON.stringify(eventValue)
      }
    },
    ReturnConsumedCapacity: "TOTAL"
  }
  try {
    const result = await ddb.putItem(params)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

const getEvent = async (eventKey) => {
  const params = {
    TableName: "LUCKYBALL_EVENT",
    Key: {
      "eventKey": {
        "S": `${eventKey}`
      }
    }
  }
  try {
    const _event = (await ddb.getItem(params)).Item
    if (!_event) return null
    return  JSON.parse(_event.eventValue.S)
  } catch (err) {
    console.error(err)
  }
}

