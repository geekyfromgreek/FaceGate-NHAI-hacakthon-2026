# FaceGate Integration Guide

This guide details how to integrate FaceGate into the host Datalake 3.0 React Native application.

## 1. Dependencies Installation

Add the following open-source dependencies to your `package.json`:

```json
{
  "dependencies": {
    "react-native-vision-camera": "4.0.1",
    "onnxruntime-react-native": "1.17.0",
    "expo-sqlite": "14.0.3",
    "@react-native-community/netinfo": "11.3.1",
    "expo-file-system": "17.0.1",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-reanimated": "~3.10.1"
  }
}
```

Run `npm install` or `yarn install` to fetch the packages, then rebuild native folders:
```bash
npx expo prebuild --clean
```

---

## 2. Bundling the ONNX Model

To load the model on-device entirely offline:
1. Place `facenet_mobile.onnx` into the `app/models/` or `assets/models/` directory.
2. In your `metro.config.js` or `expo` configuration, make sure the `.onnx` extension is treated as an asset:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('onnx');

module.exports = config;
```

---

## 3. SQLite Database Schema

FaceGate uses `expo-sqlite` for storing face models and local offline logs. Run the following creation query during application startup:

```sql
-- User Enrolled Embeddings Table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    embedding BLOB NOT NULL,
    enrolled_at TEXT NOT NULL
);

-- Offline Audit/Authentication Logs Table
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS' or 'FAILURE'
    timestamp TEXT NOT NULL,
    synced INTEGER DEFAULT 0 -- 0 = Pending, 1 = Synced
);
```

---

## 4. API Reference

### Face Enrollment (`enroll`)

Call this function to save a new user after capturing 3 face frames:

```typescript
import { enrollUser } from '../utils/embeddingStore';

/**
 * Enrolls a user with averaged embedding vectors.
 * @param userId - Unique employee/personnel identifier
 * @param name - Full name of the user
 * @param embeddings - Array of three 128-dimensional vectors (number[][])
 */
await enrollUser(userId, name, embeddings);
```

### Face Authentication (`authenticate`)

Call this during the face scan to verify the camera subject:

```typescript
import { matchFace } from '../utils/faceRecognition';

/**
 * Matches a live embedding vector against all stored users.
 * @param liveEmbedding - The 128-dimensional vector from ONNX runtime inference
 * @returns Object with match results
 */
const result = await matchFace(liveEmbedding);
if (result.success) {
  console.log(`Verified as: ${result.user.name} (ID: ${result.user.user_id})`);
} else {
  console.log('User not recognized');
}
```

---

## 5. Navigation Integration

FaceGate UI screens fit directly into your existing React Navigation stack. Add these screens to your Root Navigator:

```typescript
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import EnrollScreen from './screens/EnrollScreen';
import AuthScreen from './screens/AuthScreen';
import SyncScreen from './screens/SyncScreen';

const Stack = createStackNavigator();

function FaceGateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FaceGateHome" component={HomeScreen} />
      <Stack.Screen name="FaceGateEnroll" component={EnrollScreen} />
      <Stack.Screen name="FaceGateAuth" component={AuthScreen} />
      <Stack.Screen name="FaceGateSync" component={SyncScreen} />
    </Stack.Navigator>
  );
}
```
No bottom tab navigation is required. All screens utilize the standard back arrow pattern in the top left, which ensures perfect compliance with the Datalake 3.0 navigation guidelines.

---

## 6. AWS Serverless Backend Integration

For AWS deployment, the `syncLogsToCloud` function directs HTTP traffic to **Amazon API Gateway**, which exposes a REST API that forwards payloads to an **AWS Lambda** handler.

### AWS Infrastructure Architecture
```
[React Native App] 
       │ (HTTP POST JSON payload)
       ▼
 [AWS API Gateway] (REST Endpoint)
       │ (JSON Trigger Event)
       ▼
  [AWS Lambda] (Node.js microservice)
       │ (DocumentClient batchWrite)
       ▼
 [Amazon DynamoDB] (auth_logs Table)
```

### AWS Lambda Handler (Node.js + DynamoDB Client)
Deploy the following Lambda function on AWS to process and write incoming log payloads to a DynamoDB table:

```javascript
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON body format." })
    };
  }

  const { logs } = body;
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Database sync writing error.", details: error.message })
    };
  }
};
```

