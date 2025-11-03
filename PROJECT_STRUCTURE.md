# Project Structure

FileUpload/
├── azure-function/              # Azure Function for creating upload sessions
│   ├── createUploadSession/     # HTTP trigger function
│   │   ├── function.json        # Function bindings
│   │   └── index.ts             # Function implementation
│   ├── package.json             # Node dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── host.json                # Function host config
│   └── local.settings.json      # Local environment variables
│
├── pcf-control/                 # PowerApps Component Framework control
│   ├── css/                     # Styles
│   │   └── LargeFileUploader.css
│   ├── generated/               # Auto-generated type definitions (created after build)
│   ├── ControlManifest.Input.xml  # PCF manifest
│   ├── index.ts                 # Control implementation
│   ├── package.json             # Node dependencies
│   └── tsconfig.json            # TypeScript config
│
├── solution/                    # Power Apps solution (created manually)
│   └── bin/Debug/               # Built solution packages (after msbuild)
│
├── README.md                    # Complete documentation
├── get-site-id.ps1             # Helper: Get SharePoint Site ID
├── test-function.ps1           # Helper: Test function locally
├── deploy.ps1                  # Helper: Deploy to Azure
├── SITE_ID.txt                 # Generated Site ID (after running script)
└── FUNCTION_URL.txt            # Generated Function URL (after deployment)

## Key Files

### Azure Function
- **createUploadSession/index.ts**: Main logic - gets app token, calls Graph API
- **local.settings.json**: Contains your credentials (DO NOT commit to git)
- **function.json**: HTTP trigger configuration with CORS

### PCF Control
- **index.ts**: PCF control with file input, progress bar, chunked upload
- **ControlManifest.Input.xml**: Defines control properties (URL, siteId, path)
- **css/LargeFileUploader.css**: Control styling

### Helper Scripts
- **get-site-id.ps1**: Retrieves SharePoint Site ID using Graph API
- **test-function.ps1**: Tests Azure Function locally before deployment
- **deploy.ps1**: Automated deployment to Azure

## Build Outputs (Generated)

After building, these folders will be created:

```
azure-function/
└── dist/                       # Compiled JavaScript from TypeScript

pcf-control/
├── out/                        # Built PCF control bundle
└── generated/                  # PCF type definitions

solution/
└── bin/
    └── Debug/
        └── *.zip               # Importable solution packages
```

## Credentials (Your Configuration)

Located in `azure-function/local.settings.json`:
- Tenant ID: 60c1ab77-e242-45e9-9ff7-d35d252574ed
- Client ID: e032c00f-8951-4303-a4f4-b6cd305b22c7
- Client Secret: YOUR_CLIENT_SECRET_HERE

When deploying to Azure, these are set as Application Settings in the Function App.
