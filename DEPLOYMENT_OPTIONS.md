# Quick Deployment Guide - Manual Steps

## Current Status
✅ SharePoint Site ID obtained: `m365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c`

## Issue
Your system has Node.js v12, but Azure Functions v4 requires Node.js 18+

## Solution: Deploy via Azure Portal (Easiest)

### Option 1: Deploy Using VS Code (RECOMMENDED)

1. **Install VS Code Azure Functions Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Azure Functions"
   - Install the extension

2. **Sign in to Azure**
   - Click Azure icon in sidebar
   - Click "Sign in to Azure"
   - Use tenant: `60c1ab77-e242-45e9-9ff7-d35d252574ed`

3. **Deploy Function**
   - Right-click on `azure-function` folder
   - Select "Deploy to Function App..."
   - Choose "Create new Function App in Azure"
   - Name: `func-fileupload-<yourname>`
   - Runtime: Node.js 18
   - Location: East US
   - Wait for deployment

4. **Configure Settings in Azure Portal**
   - Go to https://portal.azure.com
   - Find your Function App
   - Go to Configuration → Application Settings
   - Add these settings:
     ```
     AZ_TENANT_ID = 60c1ab77-e242-45e9-9ff7-d35d252574ed
     AZ_CLIENT_ID = e032c00f-8951-4303-a4f4-b6cd305b22c7
     AZ_CLIENT_SECRET = YOUR_CLIENT_SECRET_HERE
     ```
   - Save

5. **Enable CORS**
   - In Function App → CORS
   - Add `*` (for testing) or your Power Apps domain
   - Save

6. **Get Function URL**
   - Go to Functions → createUploadSession
   - Click "Get Function URL"
   - Copy the URL (includes the function key)

---

### Option 2: Deploy via Azure Portal (Manual Upload)

1. **Create Function App in Portal**
   - Go to https://portal.azure.com
   - Click "Create a resource" → "Function App"
   - Fill in:
     - Resource Group: Create new "rg-fileupload"
     - Function App name: `func-fileupload-<unique>`
     - Runtime stack: Node.js
     - Version: 18 LTS
     - Region: East US
     - Plan: Consumption
   - Click "Review + Create" → "Create"

2. **Configure App Settings**
   - Once created, go to Configuration
   - Add Application Settings:
     ```
     AZ_TENANT_ID = 60c1ab77-e242-45e9-9ff7-d35d252574ed
     AZ_CLIENT_ID = e032c00f-8951-4303-a4f4-b6cd305b22c7
     AZ_CLIENT_SECRET = YOUR_CLIENT_SECRET_HERE
     ```

3. **Deploy Code via Portal**
   - Download this zip: Create a zip of these files from `azure-function` folder:
     ```
     azure-function/
     ├── createUploadSession/
     │   ├── function.json
     │   └── index.ts
     ├── host.json
     └── package.json
     ```
   - In Function App, go to "Deployment Center"
   - Choose "Local Git" or "ZIP Deploy"
   - Upload the zip

4. **Enable CORS**
   - CORS → Add `*`

---

### Option 3: Use Azure Cloud Shell (No local tools needed)

1. Go to https://portal.azure.com
2. Click Cloud Shell icon (top right)
3. Run these commands:

```bash
# Clone or upload your files to Cloud Shell
# Then run:

RESOURCE_GROUP="rg-fileupload"
LOCATION="eastus"
STORAGE_ACCOUNT="stfileupload$RANDOM"
FUNCTION_APP="func-fileupload-$RANDOM"

# Create resources
az group create --name $RESOURCE_GROUP --location $LOCATION
az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS
az functionapp create --resource-group $RESOURCE_GROUP --consumption-plan-location $LOCATION --runtime node --runtime-version 18 --functions-version 4 --name $FUNCTION_APP --storage-account $STORAGE_ACCOUNT

# Configure settings
az functionapp config appsettings set --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --settings AZ_TENANT_ID="60c1ab77-e242-45e9-9ff7-d35d252574ed" AZ_CLIENT_ID="e032c00f-8951-4303-a4f4-b6cd305b22c7" AZ_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"

# Enable CORS
az functionapp cors add --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --allowed-origins "*"

echo "Function App Name: $FUNCTION_APP"
echo "Function URL: https://$FUNCTION_APP.azurewebsites.net/api/createUploadSession"
```

---

## After Function is Deployed

### Test the Function

Use this PowerShell script:
```powershell
$functionUrl = "https://YOUR-FUNCTION-APP.azurewebsites.net/api/createUploadSession?code=YOUR-FUNCTION-KEY"
$siteId = "m365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c"

$body = @{
    siteId = $siteId
    fileName = "test.txt"
    itemPath = "Shared Documents"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $functionUrl -Body $body -ContentType "application/json"
```

### Next: Build PCF Control

The PCF control uses Power Apps CLI which has its own build system:

```powershell
cd pcf-control

# Install Power Apps CLI if not installed
npm install -g pac

# Restore PCF packages (doesn't require Node 18)
pac pcf push --publisher-prefix spu
```

---

## Which Option Should You Choose?

**Recommended: Option 1 (VS Code)** - Easiest and most reliable
- No command line issues
- Built-in authentication
- One-click deployment

**Alternative: Option 2 (Portal)** - If you prefer GUI
- All done in browser
- No local tools needed

**For Automation: Option 3 (Cloud Shell)** - If comfortable with command line
- Everything runs in Azure's environment
- No local dependencies

---

Let me know which option you'd like to proceed with, and I'll guide you through it!
