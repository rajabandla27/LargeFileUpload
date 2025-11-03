# Canvas App File Upload Solution

Since PCF controls have limited support in Canvas Apps, here's a better approach using Canvas App native controls.

## Solution: Use HTML Text Control + Power Fx

### Step 1: Add HTML Text Control to Canvas App

1. Open your Canvas App in Power Apps Studio
2. Insert → Text → HTML text control
3. Set the HtmlText property to this code:

```html
"<div id='fileUploadContainer'>
  <input type='file' id='fileInput' style='margin: 10px; padding: 10px; border: 2px solid #0078d4; border-radius: 4px;' />
  <button id='uploadBtn' style='padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 10px;'>Upload to SharePoint</button>
  <div id='progress' style='margin: 10px; font-weight: bold;'></div>
  <script>
    const FUNCTION_URL = 'https://func-fileupload-raj158.azurewebsites.net/api/createUploadSession';
    const SITE_ID = 'm365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c';
    const CHUNK_SIZE = 5 * 1024 * 1024;

    document.getElementById('uploadBtn').onclick = async function() {
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      const progress = document.getElementById('progress');
      
      if (!file) {
        progress.textContent = 'Please select a file';
        return;
      }

      try {
        progress.textContent = 'Creating upload session...';
        
        // Get upload URL from Azure Function
        const sessionRes = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: SITE_ID,
            fileName: file.name,
            itemPath: 'Shared Documents'
          })
        });
        
        const session = await sessionRes.json();
        const uploadUrl = session.uploadUrl;
        
        progress.textContent = 'Uploading...';
        
        // Upload in chunks
        let start = 0;
        while (start < file.size) {
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const contentRange = `bytes ${start}-${end-1}/${file.size}`;
          
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Range': contentRange },
            body: chunk
          });
          
          if (uploadRes.status === 200 || uploadRes.status === 201) {
            progress.textContent = '✓ Upload complete!';
            break;
          } else if (uploadRes.status === 202) {
            start = end;
            const percent = Math.round((start / file.size) * 100);
            progress.textContent = `Uploading: ${percent}%`;
          } else {
            throw new Error('Upload failed');
          }
        }
      } catch (err) {
        progress.textContent = '✗ Error: ' + err.message;
      }
    };
  </script>
</div>"
```

### Step 2: Adjust Security Settings

Since Canvas Apps run in an iframe, you may need to:

1. Go to your Canvas App settings
2. Enable "Allow inline scripts" if available
3. Or use the alternative approach below

---

## Alternative: Use Power Automate Flow (Easier & More Secure)

### Step 1: Create Power Automate Flow

1. Go to https://make.powerautomate.com
2. Create new **Instant cloud flow**
3. Trigger: **PowerApps (V2)**
4. Add action: **HTTP**
   - Method: POST
   - URI: `https://func-fileupload-raj158.azurewebsites.net/api/createUploadSession`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "siteId": "m365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c",
       "fileName": "@{triggerBody()['text']}",
       "itemPath": "Shared Documents"
     }
     ```
5. Add action: **Respond to PowerApps**
   - Output: `uploadUrl` = `body('HTTP')['uploadUrl']`

### Step 2: Use Flow in Canvas App

1. In Canvas App, add **Button** control
2. Add **Attachment** control (for file selection)
3. In Button's OnSelect:
   ```powerquery
   Set(uploadResult, YourFlowName.Run(Attachment1.FileName))
   ```

---

## Option 3: Code Component (Canvas Component)

Create a custom Canvas Component (not PCF):

1. In Canvas App Studio → Insert → Custom → Canvas component
2. Add Component with HTML/JavaScript
3. Use similar upload logic as Option 1

---

## Recommended Approach

For Canvas Apps, I recommend **Option 2 (Power Automate)** because:
- ✅ No code required
- ✅ Secure
- ✅ Easy to maintain
- ✅ Works in all Canvas App environments
- ✅ No Node.js/build tools needed

---

## If You Still Want PCF for Model-Driven Apps

Let me know and I can:
1. Provide pre-built solution package
2. Guide you through importing to Power Apps
3. Show you how to use it in Model-Driven Apps

**Which approach would you like to use?**
1. Power Automate Flow (easiest)
2. HTML Text control with JavaScript
3. PCF for Model-Driven App instead
