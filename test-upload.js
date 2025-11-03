// test-upload.js - Test Azure Function with actual file upload
const fs = require('fs');
const https = require('https');
const path = require('path');

const FUNCTION_URL = 'https://func-fileupload-raj158.azurewebsites.net/api/createuploadsession?code=YOUR_FUNCTION_KEY_HERE';
const SITE_ID = 'm365x34033875.sharepoint.com,a4ddfab8-404a-4f34-9aef-e2b99e266c14,0b4395d3-9309-45a6-a63d-d73bfe1d266c';
const ITEM_PATH = 'Shared Documents';
const FILE_PATH = 'C:\\Users\\rajab\\Downloads\\Portifino\\WORKING FOLDER\\June 2025 TTM Journal Lines-G&A IT Only - Bradley Filter.pdf';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// Simple fetch using https module (no dependencies needed)
function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    // Prepare body buffer
    const bodyBuffer = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8')) : null;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    // Add Content-Length if we have a body
    if (bodyBuffer) {
      reqOptions.headers['Content-Length'] = bodyBuffer.length;
    }

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data)),
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

async function main() {
  console.log('='.repeat(50));
  console.log('Testing Azure Function File Upload');
  console.log('='.repeat(50));

  // Check if file exists
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Error: File not found: ${FILE_PATH}`);
    return;
  }

  const fileName = path.basename(FILE_PATH);
  const fileSize = fs.statSync(FILE_PATH).size;
  console.log(`\nFile: ${fileName}`);
  console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  // Step 1: Create upload session
  console.log('\n[1/2] Creating upload session...');
  const sessionRes = await httpRequest(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    siteId: SITE_ID,
    fileName,
    itemPath: ITEM_PATH
  }));

  if (!sessionRes.ok) {
    const errorText = await sessionRes.text();
    console.error('Failed to create upload session:');
    console.error(`Status: ${sessionRes.status}`);
    console.error(`Response: ${errorText}`);
    return;
  }

  const session = await sessionRes.json();
  const uploadUrl = session.uploadUrl;
  console.log('✓ Upload session created!');
  console.log(`Upload URL: ${uploadUrl.substring(0, 80)}...`);
  console.log(`Expires: ${session.expiresOn}`);

  // Step 2: Upload file in chunks
  console.log('\n[2/2] Uploading file in chunks...');
  const fileBuffer = fs.readFileSync(FILE_PATH);
  let start = 0;
  let chunkIndex = 0;

  while (start < fileSize) {
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = fileBuffer.slice(start, end);
    const contentRange = `bytes ${start}-${end - 1}/${fileSize}`;

    process.stdout.write(`  Chunk ${++chunkIndex}: ${contentRange}... `);

    const res = await httpRequest(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
        'Content-Length': chunk.length
      }
    }, chunk);

    if (res.status === 200 || res.status === 201) {
      console.log('✓ Complete!');
      console.log('\n' + '='.repeat(50));
      console.log('✓✓✓ Upload successful! ✓✓✓');
      console.log('='.repeat(50));
      console.log(`\nFile uploaded to: ${ITEM_PATH}/${fileName}`);
      console.log('Check your SharePoint site to verify!');
      break;
    } else if (res.status === 202) {
      const percent = Math.round((end / fileSize) * 100);
      console.log(`✓ ${percent}%`);
      start = end;
    } else {
      const errText = await res.text();
      console.log(`✗ Failed`);
      console.error(`\nUpload failed: ${res.status}`);
      console.error(`Response: ${errText}`);
      break;
    }
  }
}

main().catch(err => {
  console.error('\n✗ Error:', err.message);
  console.error(err.stack);
});
