// Test function to debug environment variables
module.exports = async function (context, req) {
  context.log('Function invoked');
  
  const tenantId = process.env.AZ_TENANT_ID;
  const clientId = process.env.AZ_CLIENT_ID;
  const clientSecret = process.env.AZ_CLIENT_SECRET;
  
  context.log('Tenant ID:', tenantId ? 'SET' : 'MISSING');
  context.log('Client ID:', clientId ? 'SET' : 'MISSING');
  context.log('Client Secret:', clientSecret ? 'SET' : 'MISSING');
  
  context.res = {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: {
      message: "Environment check",
      tenantId: tenantId ? "SET" : "MISSING",
      clientId: clientId ? "SET" : "MISSING",
      clientSecret: clientSecret ? "SET" : "MISSING"
    }
  };
};
