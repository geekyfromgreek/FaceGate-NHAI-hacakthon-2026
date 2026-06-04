const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.AUTH_LOGS_TABLE || "nhai_datalake_auth_logs";

exports.handler = async (event) => {
  console.log("Received Sync Event:", JSON.stringify(event, null, 2));

  // Parse payload body
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ error: "Invalid JSON body format." })
    };
  }

  const { logs } = body;
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ success: true, message: "No logs to process.", count: 0 })
    };
  }

  // Segment batch writes (DynamoDB batchWrite supports up to 25 items per request)
  const batches = [];
  const logItems = [...logs];
  while (logItems.length > 0) {
    batches.push(logItems.splice(0, 25));
  }

  try {
    for (const batch of batches) {
      const writeRequests = batch.map(log => ({
        PutRequest: {
          Item: {
            log_id: `${log.user_id}#${log.timestamp}`, // Partition key
            user_id: log.user_id,
            name: log.name,
            status: log.status,
            timestamp: log.timestamp,
            synced_at: new Date().toISOString()
          }
        }
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: writeRequests
        }
      });

      await docClient.send(command);
    }

    console.log(`Successfully synced ${logs.length} logs to DynamoDB.`);
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({
        success: true,
        message: `Successfully synchronized ${logs.length} records to AWS DynamoDB.`,
        count: logs.length
      })
    };
  } catch (error) {
    console.error("DynamoDB sync write failure:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ error: "Internal Database sync writing error.", details: error.message })
    };
  }
};
