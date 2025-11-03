// Azure Function: createUploadSession (TypeScript)
import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const tenantId = process.env.AZ_TENANT_ID!;
const clientId = process.env.AZ_CLIENT_ID!;
const clientSecret = process.env.AZ_CLIENT_SECRET!;

async function getAppToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    scope: "https://graph.microsoft.com/.default",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await globalThis.fetch(url, { method: "POST", body });
  if (!res.ok) throw new Error("Failed to get token: " + await res.text());
  const json: any = await res.json();
  return json.access_token;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
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
    // Expect body: { siteId, driveId?, itemPath?, fileName }
    const { siteId, driveId, itemPath, fileName } = req.body || {};

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

    const res = await globalThis.fetch(url, {
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

    const json: any = await res.json();
    // json.uploadUrl is the resumable upload endpoint (public short-lived URL)
    context.res = {
      status: 200,
      body: {
        uploadUrl: json.uploadUrl,
        expiresOn: json.expirationDateTime || null
      },
      headers: {
        "Access-Control-Allow-Origin": "*", // set to your Power Apps domain in production
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      }
    };
    
    context.log(`Upload session created successfully. Expires: ${json.expirationDateTime}`);
  } catch (err: any) {
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

export default httpTrigger;
