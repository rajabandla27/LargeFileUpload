# VS Code Deployment Steps - Follow These

## Step 1: Sign in to Azure (Do this first!)

1. Look at the **left sidebar** in VS Code
2. Click the **Azure icon** (looks like an "A")
3. In the Azure panel, click **"Sign in to Azure..."**
4. A browser window will open
5. Sign in with your Azure account
6. When prompted for tenant, use: `60c1ab77-e242-45e9-9ff7-d35d252574ed`
7. Return to VS Code

## Step 2: Deploy the Function

1. In VS Code Explorer, **right-click** on the `azure-function` folder
2. Select **"Deploy to Function App..."**
3. You'll see a series of prompts:

   **Prompt 1:** "Select subscription"
   - Choose your subscription

   **Prompt 2:** "Select Function App"
   - Choose **"+ Create new Function App in Azure (Advanced)"**

   **Prompt 3:** "Enter a globally unique name"
   - Type: `func-fileupload-raj` (or any unique name)

   **Prompt 4:** "Select a runtime stack"
   - Choose: **Node.js 18 LTS**

   **Prompt 5:** "Select an OS"
   - Choose: **Windows**

   **Prompt 6:** "Select a resource group"
   - Choose **"+ Create new resource group"**
   - Name it: `rg-fileupload`

   **Prompt 7:** "Select a location"
   - Choose: **East US** (or closest to you)

   **Prompt 8:** "Select a hosting plan"
   - Choose: **Consumption**

   **Prompt 9:** "Select a storage account"
   - Choose **"+ Create new storage account"**
   - Accept the default name

   **Prompt 10:** "Select an Application Insights resource"
   - Choose **"Skip for now"** or create one

4. Wait for deployment (takes 2-5 minutes)
5. When done, you'll see "Deployment successful" notification

## Step 3: Configure Environment Variables

### Option A: Via VS Code
1. In the Azure panel (left sidebar)
2. Expand your subscription → Function Apps
3. Right-click your function app → **"Open in Portal"**
4. Continue with "Option B" below

### Option B: Via Azure Portal
1. Go to https://portal.azure.com
2. Search for your function app name (e.g., `func-fileupload-raj`)
3. In left menu, click **"Configuration"**
4. Click **"+ New application setting"** for each:

   **Setting 1:**
   - Name: `AZ_TENANT_ID`
   - Value: `60c1ab77-e242-45e9-9ff7-d35d252574ed`

   **Setting 2:**
   - Name: `AZ_CLIENT_ID`
   - Value: `e032c00f-8951-4303-a4f4-b6cd305b22c7`

   **Setting 3:**
   - Name: `AZ_CLIENT_SECRET`
   - Value: `YOUR_CLIENT_SECRET_HERE`

5. Click **"Save"** at the top
6. Click **"Continue"** when prompted

## Step 4: Enable CORS

Still in Azure Portal:
1. In left menu, scroll down to **"CORS"**
2. Under "Allowed Origins", add: `*`
3. Click **"Save"** at the top

## Step 5: Get Your Function URL

1. In left menu, click **"Functions"**
2. Click **"createUploadSession"**
3. Click **"Get Function Url"** button at the top
4. Click **"Copy"**
5. Save this URL - you'll need it for the PCF control!

The URL will look like:
```
https://func-fileupload-raj.azurewebsites.net/api/createUploadSession?code=xxxxxxxxxxxxx
```

## Step 6: Test the Function

Run this in PowerShell:
```powershell
$functionUrl = "PASTE_YOUR_FUNCTION_URL_HERE"
$siteId = "m365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c"

$body = @{
    siteId = $siteId
    fileName = "test.txt"
    itemPath = "Shared Documents"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $functionUrl -Body $body -ContentType "application/json"
```

If successful, you'll get back an `uploadUrl` - that means it's working!

## Next: Build PCF Control

Once the function is deployed and tested, run:
```powershell
cd c:\Users\rajab\Downloads\FileUpload\pcf-control
npm install
npm run build
```

---

## Troubleshooting

**Can't see Azure icon?**
- View → Command Palette → "Azure: Focus on Azure View"

**Deployment fails?**
- Check you're signed in to the correct Azure tenant
- Try deploying again (sometimes first deploy times out)

**Function returns 401/403?**
- Make sure all 3 environment variables are set correctly
- Check the app registration has admin consent

**CORS errors?**
- Ensure you added `*` in CORS settings
- Click Save after adding

---

## Ready?

Start with **Step 1** above - sign in to Azure in VS Code!
