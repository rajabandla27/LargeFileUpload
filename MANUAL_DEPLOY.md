# Manual Azure Portal Deployment Steps

Your app registration is configured correctly with all required permissions!
✅ Files.ReadWrite.All (Application) - Granted
✅ Sites.ReadWrite.All (Application) - Granted  
✅ User.Read (Delegated) - Granted

Since Azure CLI is having subscription issues, let's deploy via Azure Portal:

## Step 1: Create Function App in Portal

1. Go to: https://portal.azure.com
2. Click **"Create a resource"**
3. Search for **"Function App"** and click it
4. Click **"Create"**

### Basics Tab:
- **Subscription**: Azure subscription 1
- **Resource Group**: Select **rg-fileupload** (already created)
- **Function App name**: `func-fileupload-raj` (must be globally unique)
- **Publish**: Code
- **Runtime stack**: Node.js
- **Version**: 20 LTS
- **Region**: East US
- **Operating System**: Windows
- **Plan type**: Consumption (Serverless)

Click **"Review + Create"** → **"Create"**

Wait 2-3 minutes for deployment.

## Step 2: Upload Function Code

### Option A: Via Portal (Easiest)
1. Go to your Function App
2. Click **"Deployment Center"** in left menu
3. Choose **"Local Git"** or **"External Git"**
4. Or use **"ZIP Deploy"**

### Option B: Via VS Code (Recommended)
1. In VS Code, open Azure panel (left sidebar)
2. Expand **"Function App"** under your subscription
3. Right-click your new function app → **"Deploy to Function App"**
4. Select the `azure-function` folder
5. Wait for deployment

## Step 3: Configure App Settings

1. In Azure Portal, go to your Function App
2. Click **"Configuration"** (under Settings)
3. Click **"+ New application setting"** for each:

**Setting 1:**
- Name: `AZ_TENANT_ID`
- Value: `60c1ab77-e242-45e9-9ff7-d35d252574ed`
- Click OK

**Setting 2:**
- Name: `AZ_CLIENT_ID`
- Value: `e032c00f-8951-4303-a4f4-b6cd305b22c7`
- Click OK

**Setting 3:**
- Name: `AZ_CLIENT_SECRET`
- Value: `YOUR_CLIENT_SECRET_HERE`
- Click OK

4. Click **"Save"** at the top
5. Click **"Continue"** to restart the app

## Step 4: Enable CORS

1. In left menu, scroll to **"CORS"**
2. Under "Allowed Origins", add: `*`
3. Click **"Save"**

## Step 5: Get Function URL

1. Click **"Functions"** in left menu
2. Click **"createUploadSession"**
3. Click **"Get Function Url"** button at top
4. Click **"Copy"** (default key)
5. Save this URL

## Step 6: Test the Function

Run in PowerShell:
```powershell
cd c:\Users\rajab\Downloads\FileUpload
.\test-deployed-function.ps1
```

When prompted, paste your Function URL.

---

## Quick Alternative: Deploy from VS Code Now

Since your resource group exists, try this:

1. Open Azure panel in VS Code (left sidebar, Azure icon)
2. Sign in if needed
3. Expand your subscription
4. Right-click **"Function App"** → **"Create Function App in Azure (Advanced)"**
5. Follow prompts:
   - Name: `func-fileupload-raj`
   - Runtime: Node.js 20
   - OS: Windows
   - Resource Group: **Use existing rg-fileupload**
   - Location: East US
   - Plan: Consumption
   - Storage: Create new
   - App Insights: Skip

6. After creation, right-click the function app → **"Deploy to Function App"**
7. Select `azure-function` folder

Then continue with Steps 3-6 above.

---

Would you like to try the VS Code deployment (recommended) or Portal manual creation?
