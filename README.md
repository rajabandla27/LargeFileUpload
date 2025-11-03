# Large File Upload to SharePoint - Setup & Deployment Guide

This solution enables uploading large files (250+ MB) from Power Apps to SharePoint using a PCF custom control and Azure Function.

## Architecture

1. **Azure AD App** - Provides authentication with application permissions (Sites.ReadWrite.All)
2. **Azure Function** - Creates Graph API upload sessions with app-only token
3. **PCF Control** - Browser-based control that uploads files in chunks to SharePoint

## Prerequisites

- Node.js 18+ and npm
- Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4`
- Power Apps CLI: `npm install -g pac`
- Azure subscription
- Power Apps environment with admin access

## Your Configuration

**Tenant ID**: `60c1ab77-e242-45e9-9ff7-d35d252574ed`
**Client ID**: `e032c00f-8951-4303-a4f4-b6cd305b22c7`
**Client Secret**: `YOUR_CLIENT_SECRET_HERE`
**SharePoint Site**: `https://m365x34033875.sharepoint.com/sites/Design`

## Step 1: Get SharePoint Site ID

You need the Site ID for the SharePoint site. Run this PowerShell command:

```powershell
# Install Microsoft Graph PowerShell if needed
# Install-Module Microsoft.Graph -Scope CurrentUser

Connect-MgGraph -TenantId "60c1ab77-e242-45e9-9ff7-d35d252574ed" -Scopes "Sites.Read.All"

# Get site ID
$site = Get-MgSite -Search "Design"
$site.Id
```

Or use Graph Explorer:
```
GET https://graph.microsoft.com/v1.0/sites/m365x34033875.sharepoint.com:/sites/Design
```

The ID will be in format: `m365x34033875.sharepoint.com,<guid>,<guid>`

## Step 2: Build and Test Azure Function Locally

```powershell
# Navigate to function folder
cd azure-function

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start function locally (runs on http://localhost:7071)
npm start
```

Test the function:
```powershell
# In another terminal
$body = @{
    siteId = "<YOUR_SITE_ID>"
    fileName = "test.txt"
    itemPath = "Shared Documents"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:7071/api/createUploadSession" -Body $body -ContentType "application/json"
```

## Step 3: Deploy Azure Function to Azure

### Option A: Deploy via VS Code
1. Install Azure Functions extension in VS Code
2. Right-click on `azure-function` folder → Deploy to Function App
3. Create new Function App or select existing one
4. Wait for deployment to complete

### Option B: Deploy via Azure CLI

```powershell
# Login to Azure
az login --tenant 60c1ab77-e242-45e9-9ff7-d35d252574ed

# Create resource group (if needed)
az group create --name rg-fileupload --location eastus

# Create storage account
az storage account create --name stfileupload<random> --resource-group rg-fileupload --location eastus --sku Standard_LRS

# Create function app
az functionapp create --resource-group rg-fileupload --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name func-fileupload-<random> --storage-account stfileupload<random>

# Configure app settings
az functionapp config appsettings set --name func-fileupload-<random> --resource-group rg-fileupload --settings AZ_TENANT_ID="60c1ab77-e242-45e9-9ff7-d35d252574ed" AZ_CLIENT_ID="e032c00f-8951-4303-a4f4-b6cd305b22c7" AZ_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"

# Enable CORS
az functionapp cors add --name func-fileupload-<random> --resource-group rg-fileupload --allowed-origins "*"

# Deploy from folder
cd azure-function
func azure functionapp publish func-fileupload-<random>
```

**Important**: Note your function URL: `https://func-fileupload-<random>.azurewebsites.net/api/createUploadSession`

## Step 4: Build PCF Control

```powershell
# Navigate to PCF control folder
cd ..\pcf-control

# Install dependencies
npm install

# Build the control
npm run build
```

## Step 5: Test PCF Control Locally

```powershell
# Start test harness
npm start watch

# Browser will open at http://localhost:8181/
# Configure these properties in the test harness:
# - azureFunctionUrl: https://func-fileupload-<random>.azurewebsites.net/api/createUploadSession
# - siteId: <YOUR_SITE_ID>
# - itemPath: Shared Documents (optional)
```

## Step 6: Package and Deploy PCF Control

### Create Solution

```powershell
# Go back to root folder
cd ..

# Create solution folder
mkdir solution
cd solution

# Initialize solution
pac solution init --publisher-name SharePointUpload --publisher-prefix spu

# Add reference to PCF control
pac solution add-reference --path ..\pcf-control

# Build solution (creates managed/unmanaged zip files)
msbuild /t:build /restore
```

### Import to Power Apps

1. Go to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → **Import solution**
4. Upload the solution zip file from `solution\bin\Debug\`
5. Click **Next** → **Import**

### Add Control to Canvas App

1. Open your Canvas App or create a new one
2. Click **Insert** → **Get more components**
3. Select **Code** tab
4. Find and import **LargeFileUploader**
5. Insert the control from **Insert** → **Custom** → **LargeFileUploader**
6. Configure properties:
   - **azureFunctionUrl**: `https://func-fileupload-<random>.azurewebsites.net/api/createUploadSession`
   - **siteId**: `<YOUR_SITE_ID>`
   - **itemPath**: `Shared Documents` (or leave blank for root)

## Step 7: Security Configuration

### Secure Azure Function

```powershell
# Get function key
$key = az functionapp function keys list --name func-fileupload-<random> --resource-group rg-fileupload --function-name createUploadSession --query "default" -o tsv

# Update PCF control to use key:
# azureFunctionUrl: https://func-fileupload-<random>.azurewebsites.net/api/createUploadSession?code=$key
```

### Restrict CORS (Production)

```powershell
# Remove wildcard CORS
az functionapp cors remove --name func-fileupload-<random> --resource-group rg-fileupload --allowed-origins "*"

# Add specific Power Apps domains
az functionapp cors add --name func-fileupload-<random> --resource-group rg-fileupload --allowed-origins "https://apps.powerapps.com" "https://apps.preview.powerapps.com"
```

## Troubleshooting

### Function Returns 401/403
- Verify app registration has Sites.ReadWrite.All or Files.ReadWrite.All
- Ensure admin consent was granted
- Check client secret hasn't expired

### CORS Errors
- Enable CORS for your Power Apps domain in Azure Function
- Check browser console for specific CORS error

### Upload Fails Midway
- Check chunk size (default 5MB, increase if network is stable)
- Verify upload session hasn't expired (1 hour default)
- Check SharePoint storage quota

### PCF Control Not Loading
- Verify solution import was successful
- Check browser console for errors
- Ensure all required properties are set

## File Size Limits

- **Default chunk size**: 5 MB
- **Recommended max file**: 250 MB
- **Graph API max**: 250 GB (requires session renewal for >100GB)
- **Upload session validity**: 1 hour

## Testing Checklist

- [ ] Azure Function returns upload URL when called locally
- [ ] Azure Function deployed and accessible via HTTPS
- [ ] Site ID obtained and verified
- [ ] PCF control builds without errors
- [ ] PCF control works in test harness
- [ ] Solution imports to Power Apps successfully
- [ ] Control added to Canvas App
- [ ] Small file (1-5 MB) uploads successfully
- [ ] Large file (50-100 MB) uploads successfully
- [ ] Progress bar shows accurate progress
- [ ] File appears in SharePoint document library

## Support

For issues:
1. Check Azure Function logs in Azure Portal → Function App → Log Stream
2. Check browser console for PCF errors
3. Verify Graph API permissions in Azure AD
4. Test Graph API directly using Graph Explorer

## Next Steps

1. Customize UI styling in `pcf-control/css/LargeFileUploader.css`
2. Add file type restrictions in PCF control
3. Implement upload cancellation
4. Add retry logic for transient failures
5. Store upload metadata in Dataverse
