const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const BASE_URL = "https://daiee5zick.execute-api.af-south-1.amazonaws.com/prod";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Support two routing modes:
    // 1. Query param: /api-proxy/r?target=/documents/upload-url
    // 2. Path-based:  /api-proxy/tasks/123
    let targetPath = url.searchParams.get('target');
    if (!targetPath) {
      targetPath = url.pathname.replace(/^\/api-proxy/, '');
    }
    // Clean up dummy path segment used for query-param mode
    if (targetPath === '/r' || targetPath === '/r/') {
      targetPath = url.searchParams.get('target') || '';
    }
    
    if (!targetPath || targetPath === '/' || targetPath === '/r') {
      return new Response(JSON.stringify({ error: "Missing target path" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = `${BASE_URL}${targetPath}`;
    
    const headers: Record<string, string> = {};
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const contentType = req.headers.get('content-type');
    if (contentType && req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = contentType;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    }

    console.log(`[api-proxy] ${req.method} ${targetPath} -> ${targetUrl}`);
    const response = await fetch(targetUrl, fetchOptions);
    const responseBody = await response.text();
    if (!response.ok) {
      console.error(`[api-proxy] upstream ${response.status}: ${responseBody.substring(0, 500)}`);
    }

    const responseHeaders: Record<string, string> = { ...corsHeaders };
    const upstreamContentType = response.headers.get('content-type');
    if (upstreamContentType) {
      responseHeaders['Content-Type'] = upstreamContentType;
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});