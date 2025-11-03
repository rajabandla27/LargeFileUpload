// Azure Function: createUploadSession (JavaScript)
const tenantId = process.env.AZ_TENANT_ID;
const clientId = process.env.AZ_CLIENT_ID;
const clientSecret = process.env.AZ_CLIENT_SECRET;

async function getAppToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const res = await fetch(url, { 
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Failed to get token: " + errorText);
  }
  
  const json = await res.json();
  return json.access_token;
}

module.exports = async function (context, req) {
  // Log environment variables (for debugging)
  context.log('Tenant ID exists:', !!tenantId);
  context.log('Client ID exists:', !!clientId);
  context.log('Client Secret exists:', !!clientSecret);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    context.res = {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
    return;
  }

  try {
    // Log the raw request for debugging
    context.log('Request method:', req.method);
    context.log('Request body type:', typeof req.body);
    context.log('Request body:', JSON.stringify(req.body));
    
    // Expect body: { siteId, driveId?, itemPath?, fileName }
    // Parse body if it's a string
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { siteId, driveId, itemPath, fileName } = body || {};
    
    context.log('Parsed siteId:', siteId);
    context.log('Parsed fileName:', fileName);

    if (!siteId || !fileName) {
      context.res = { 
        status: 400, 
        body: "Missing siteId or fileName",
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };
      return;
    }

    context.log(`Creating upload session for file: ${fileName} at site: ${siteId}`);

    const token = await getAppToken();

    // Build Graph endpoint: upload in a path:
    // POST /sites/{siteId}/drive/root:/{itemPath}/{fileName}:/createUploadSession
    const targetPath = itemPath ? `${itemPath}/${fileName}` : fileName;
    const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${encodeURIComponent(targetPath)}:/createUploadSession`;

    const bodyData = {
      item: {
        "@microsoft.graph.conflictBehavior": "replace",
        name: fileName
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      const txt = await res.text();
      context.log.error(`Graph API error: ${res.status} - ${txt}`);
      context.res = { 
        status: res.status, 
        body: `Graph error: ${txt}`,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };
      return;
    }

    const json = await res.json();
    // json.uploadUrl is the resumable upload endpoint (public short-lived URL)
    context.res = {
      status: 200,
      body: {
        uploadUrl: json.uploadUrl,
        expiresOn: json.expirationDateTime || null
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      }
    };
    
    context.log(`Upload session created successfully. Expires: ${json.expirationDateTime}`);
  } catch (err) {
    context.log.error("Error in createUploadSession:", err);
    context.res = { 
      status: 500, 
      body: err.message,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    };
  }
};
