# AWS Serverless Deployment Guide

This guide describes how to configure, deploy, and connect the AWS Serverless Sync Backend (DynamoDB + Lambda + API Gateway) for FaceGate.

---

## Step 1: Create the Amazon DynamoDB Table

DynamoDB will persistently store all authenticated attendance logs synchronized from field devices.

1. Open the **AWS Console** and navigate to **DynamoDB**.
2. Click **Create Table** and configure:
   - **Table Name**: `nhai_datalake_auth_logs`
   - **Partition Key**: `log_id` (Type: `String`)
   - *Leave all other settings as default.*
3. Click **Create Table** and wait for the status to turn to **Active**.

---

## Step 2: Create and Configure the AWS Lambda Function

The Lambda function processes incoming JSON payloads, segments them into database chunks, and performs bulk writes to DynamoDB.

1. Navigate to **AWS Lambda** in the AWS Console.
2. Click **Create Function**:
   - Choose **Author from scratch**.
   - **Function Name**: `facegate-attendance-sync`
   - **Runtime**: `Node.js 18.x` or `Node.js 20.x`
   - **Architecture**: `x86_64`
3. Click **Create Function**.
4. In the **Code** tab, clear the default template and paste the deployable code from:
   📂 **[aws/lambdaSync.js](file:///C:/Users/karpe/FaceGate/aws/lambdaSync.js)**
5. Click **Deploy**.

### Set Environment Variables:
1. Go to the **Configuration** tab $\rightarrow$ **Environment variables**.
2. Click **Edit** $\rightarrow$ **Add environment variable**:
   - **Key**: `AUTH_LOGS_TABLE`
   - **Value**: `nhai_datalake_auth_logs`
3. Click **Save**.

### Grant Database Access Permissions (IAM):
1. In the **Configuration** tab, select **Permissions**.
2. Click on the **Role Name** link under *Execution role* to open the role in the IAM Console.
3. Click **Add permissions** $\rightarrow$ **Create inline policy**.
4. Select the **JSON** tab and paste the following DynamoDB write policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:BatchWriteItem",
           "dynamodb:PutItem"
         ],
         "Resource": "arn:aws:dynamodb:*:*:table/nhai_datalake_auth_logs"
       }
     ]
   }
   ```
5. Click **Review policy**, name it `DynamoDBSyncWritePolicy`, and click **Create policy**.

---

## Step 3: Set up AWS API Gateway

API Gateway exposes a secure public HTTPS endpoint that the mobile application can query over the internet.

1. Navigate to **API Gateway** in the AWS Console.
2. Click **Create API** and choose **HTTP API** (recommended for low latency and cost efficiency).
3. Click **Build**:
   - **API Name**: `facegate-sync-api`
   - Click **Next**.
4. Configure Routes:
   - Click **Add Route**.
   - **Method**: `POST`
   - **Path**: `/sync`
   - Click **Next**.
5. Configure Integrations:
   - **Integration Target**: Choose `Lambda`.
   - **AWS Region**: Select the region where you created the Lambda function.
   - **Lambda Function**: Select `facegate-attendance-sync`.
   - Click **Next**.
6. Keep stage as `$default` (with auto-deploy enabled) and click **Create**.
7. Copy the **Invoke URL** displayed on the dashboard (e.g., `https://abc123xyz.execute-api.us-east-1.amazonaws.com`).

### Enable CORS (Cross-Origin Resource Sharing):
To allow requests from web preview browsers:
1. In the API Gateway menu, select **CORS** under *Develop*.
2. Click **Configure**:
   - **Access-Control-Allow-Origin**: Enter `*` (or your client domain).
   - **Access-Control-Allow-Headers**: Add `content-type`, `authorization`.
   - **Access-Control-Allow-Methods**: Select `POST`, `OPTIONS`.
3. Click **Save**.

---

## Step 4: Link the Mobile Application to AWS

Now that the AWS backend is running, update your client configuration:

1. Open [syncManager.ts](file:///C:/Users/karpe/FaceGate/app/utils/syncManager.ts).
2. Update the default endpoint parameter in the `syncLogsToCloud` function definition to point to your new API Gateway URL:
   ```typescript
   // Replace with your API Gateway Invoke URL followed by the route path /sync
   export async function syncLogsToCloud(
     endpoint: string = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/sync'
   ): Promise<SyncResult> {
   ```
3. Rebuild or reload the React Native application. When network connection is active, logs will now sync directly to Amazon DynamoDB!
