# FileUploader PCF Control

A Power Apps Component Framework (PCF) control for uploading large files to SharePoint using Azure Functions.

## Features

- Upload large files (250+ MB) to SharePoint
- Chunked upload with progress tracking
- Uses Azure Function backend for resumable uploads
- Simple file picker interface

## Prerequisites

- Node.js 20 or later
- Power Platform CLI (pac)
- Azure Function for creating SharePoint upload sessions
- SharePoint site with document library

## Configuration

Before building or deploying, update the following constants in `FileUploader/index.ts`:

```typescript
const FUNCTION_URL = "YOUR_AZURE_FUNCTION_URL"; // Your Azure Function URL with access code
const SITE_ID = "YOUR_SHAREPOINT_SITE_ID"; // Your SharePoint Site ID (format: domain,siteId,webId)
const ITEM_PATH = "Shared Documents"; // Target SharePoint document library
```

### Getting Your Configuration Values

1. **Azure Function URL**: Deploy the Azure Function from `/azure-function` folder and copy the function URL with code
2. **SharePoint Site ID**: Use Microsoft Graph Explorer to get site ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-name}
   ```
3. **Item Path**: The name of your SharePoint document library (default: "Shared Documents")

## Development

### Install Dependencies

```powershell
npm install
```

### Build

```powershell
npm run build
```

### Test Locally

```powershell
npm start
```

This will start the test harness at http://localhost:8181

### Deploy to Power Platform

#### Option 1: Push directly (recommended for development)

```powershell
pac pcf push --publisher-prefix <your-prefix>
```

#### Option 2: Create solution package

```powershell
# Create a new solution
pac solution init --publisher-name YourPublisher --publisher-prefix yourprefix

# Add PCF reference
pac solution add-reference --path .

# Build solution
msbuild /t:build /restore

# Import the generated .zip file through Power Apps portal
```

## Usage in Power Apps

1. Open your Canvas App in Power Apps Studio
2. Insert > Get more components > Code tab
3. Select "FileUploader" control
4. Add the control to your canvas
5. Users can click "Choose File" to select a file and "Upload to SharePoint" to upload

## Architecture

- **Frontend**: PCF control with file picker and upload button
- **Backend**: Azure Function creates SharePoint upload sessions
- **Storage**: Files uploaded directly to SharePoint document library
- **Upload Method**: Chunked upload using SharePoint's createUploadSession API (5MB chunks)

## File Structure

```
new-pcf/
├── FileUploader/
│   ├── index.ts              # Main control logic
│   ├── ControlManifest.Input.xml  # Control manifest
│   └── generated/            # Auto-generated type definitions
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Security Notes

- Never commit Azure Function keys or access codes to source control
- Use environment-specific configuration for different deployments
- Consider using Azure Key Vault for storing sensitive values
- Implement proper authentication and authorization in your Azure Function

## Troubleshooting

### Control not appearing in Power Apps

- Ensure the solution was imported successfully
- Check that you're looking in the Code components tab
- Try refreshing the Power Apps Studio

### Upload fails

- Verify Azure Function URL is correct and accessible
- Check SharePoint Site ID format
- Ensure the Azure Function has proper permissions to SharePoint
- Check browser console for error messages

### Build errors

- Run `npm install` to ensure all dependencies are installed
- Verify Node.js version is 20 or later
- Check that all TypeScript files are valid

## License

This project is part of the LargeFileUpload solution.


New-Item -ItemType Directory -Force -Path "C:\Users\rajab\Downloads\newpcf"; Copy-Item -Path "c:\Users\rajab\Downloads\FileUpload\new-pcf\out\*" -Destination "C:\Users\rajab\Downloads\newpcf" -Recurse -Force

cd c:\Users\rajab\Downloads\newpcf; pac solution init --publisher-name RajPublisher --publisher-prefix raj

pac solution add-reference --path c:\Users\rajab\Downloads\FileUpload\new-pcf

dotnet build --configuration Release

