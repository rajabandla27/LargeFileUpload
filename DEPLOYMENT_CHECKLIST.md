# Deployment Checklist - Track Your Progress

## ✅ Step 1: Azure Sign-In (IN PROGRESS)
- [ ] Browser opened for Azure sign-in
- [ ] Signed in with Azure credentials  
- [ ] VS Code shows "Signed in" in Azure panel

**If browser didn't open:** View → Command Palette → "Azure: Sign In"

---

## Step 2: Deploy Function App

### Via VS Code (Right-click method):
1. [ ] In Explorer, right-click `azure-function` folder
2. [ ] Click "Deploy to Function App..."
3. [ ] Select your subscription
4. [ ] Choose "Create new Function App in Azure (Advanced)"
5. [ ] Enter name: `func-fileupload-YOUR-NAME`
6. [ ] Select runtime: **Node.js 18 LTS**
7. [ ] Select OS: **Windows**
8. [ ] Create resource group: `rg-fileupload`
9. [ ] Select region: **East US** (or nearest)
10. [ ] Select plan: **Consumption**
11. [ ] Create new storage account (accept default)
12. [ ] Skip Application Insights (or create)
13. [ ] Wait for deployment (2-5 minutes)
14. [ ] See "Deployment successful" notification

**Function App Name I Created:** _______________________________

---

## Step 3: Configure App Settings

### Go to Azure Portal:
1. [ ] Open https://portal.azure.com
2. [ ] Search for your function app name
3. [ ] Click on your Function App
4. [ ] In left menu → **Configuration**
5. [ ] Click **+ New application setting**

### Add these 3 settings (one at a time):

**Setting 1:**
- [ ] Name: `AZ_TENANT_ID`
- [ ] Value: `60c1ab77-e242-45e9-9ff7-d35d252574ed`
- [ ] Click OK

**Setting 2:**
- [ ] Name: `AZ_CLIENT_ID`  
- [ ] Value: `e032c00f-8951-4303-a4f4-b6cd305b22c7`
- [ ] Click OK

**Setting 3:**
- [ ] Name: `AZ_CLIENT_SECRET`
- [ ] Value: `YOUR_CLIENT_SECRET_HERE`
- [ ] Click OK

6. [ ] Click **Save** at the top
7. [ ] Click **Continue** when prompted about restart

---

## Step 4: Enable CORS

Still in Azure Portal (same Function App):
1. [ ] In left menu → scroll to **CORS**
2. [ ] In "Allowed Origins" box, type: `*`
3. [ ] Click **+ Add** or press Enter
4. [ ] Click **Save** at the top

---

## Step 5: Get Function URL

1. [ ] In left menu → **Functions**
2. [ ] Click **createUploadSession**
3. [ ] Click **Get Function Url** button (top bar)
4. [ ] Click **Copy**
5. [ ] Paste it here: _______________________________

---

## Step 6: Test Function

1. [ ] Open PowerShell
2. [ ] Run: `cd c:\Users\rajab\Downloads\FileUpload`
3. [ ] Run: `.\test-deployed-function.ps1`
4. [ ] Paste your Function URL when prompted
5. [ ] See "SUCCESS! Function is working!" message

**Test Result:** ⬜ Pass  ⬜ Fail

If failed, error was: _______________________________

---

## Step 7: Build PCF Control

Once function test passes:
```powershell
cd c:\Users\rajab\Downloads\FileUpload\pcf-control
npm install
npm run build
```

- [ ] npm install completed
- [ ] npm run build completed
- [ ] No errors in output

---

## Step 8: Create Solution Package

```powershell
cd c:\Users\rajab\Downloads\FileUpload
mkdir solution
cd solution
pac solution init --publisher-name SharePointUpload --publisher-prefix spu
pac solution add-reference --path ..\pcf-control
msbuild /t:build /restore
```

- [ ] Solution initialized
- [ ] PCF reference added
- [ ] msbuild completed
- [ ] Found ZIP file in: `solution\bin\Debug\`

---

## Step 9: Import to Power Apps

1. [ ] Go to https://make.powerapps.com
2. [ ] Select environment
3. [ ] Solutions → Import solution
4. [ ] Upload ZIP from `solution\bin\Debug\`
5. [ ] Click Next → Import
6. [ ] Wait for import to complete

---

## Step 10: Use in Canvas App

1. [ ] Open Canvas App (or create new)
2. [ ] Insert → Get more components
3. [ ] Code tab → Find "LargeFileUploader"
4. [ ] Import it
5. [ ] Insert → Custom → LargeFileUploader

### Configure properties:
- [ ] azureFunctionUrl: (paste your function URL)
- [ ] siteId: `m365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c`
- [ ] itemPath: `Shared Documents`

6. [ ] Test upload with small file
7. [ ] Test upload with large file (50+ MB)
8. [ ] Verify file appears in SharePoint

---

## ✅ Deployment Complete!

All steps done? **Congratulations!** Your large file upload solution is live! 🎉

**Function URL:** _______________________________
**SharePoint Site:** https://m365x34033875.sharepoint.com/sites/Design/Shared%20Documents
