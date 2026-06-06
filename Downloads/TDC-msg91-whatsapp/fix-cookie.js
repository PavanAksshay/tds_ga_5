import fs from 'fs';

let code = fs.readFileSync('app/lib/supabase.server.ts', 'utf8');

if (!code.includes('name: "tdc-auth"')) {
  // Add the custom name to permanently escape the HttpOnly ghost cookie from before
  code = code.replace(
    'cookies: {',
    'cookieOptions: { name: "tdc-auth" },\n    cookies: {'
  );
  
  // Remove my broken httpOnly override and instead assert it to false so JS can nuke it
  code = code.replace(
    'httpOnly: true,',
    'httpOnly: false,'
  );
  
  // Always lock cookies to the root domain explicitly
  if (!code.includes('mergedOptions.domain')) {
     code = code.replace(
        'const cookieString = serializeCookieHeader(name, value, mergedOptions);',
        `const hostname = new URL(request.url).hostname;
          if (!mergedOptions.domain && isProd && !isLocal) {
            mergedOptions.domain = hostname.startsWith('www.') ? '.' + hostname.substring(4) : '.' + hostname;
          }
          const cookieString = serializeCookieHeader(name, value, mergedOptions);`
     );
  }
  
  fs.writeFileSync('app/lib/supabase.server.ts', code);
  console.log("SUCCESS");
} else {
  console.log("ALREADY FIXED");
}
