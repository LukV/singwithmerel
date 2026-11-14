import { readFileSync } from 'node:fs';

/**
 * The live site's response headers (deploy/headers.json, the CloudFront policy) as plain headers,
 * for `vite preview`: the browser check then runs under the same content security policy.
 */
export function previewHeaders(): Record<string, string> {
  const policy = JSON.parse(readFileSync(new URL('../deploy/headers.json', import.meta.url), 'utf8')) as {
    SecurityHeadersConfig: {
      ContentSecurityPolicy: { ContentSecurityPolicy: string };
      ReferrerPolicy: { ReferrerPolicy: string };
      FrameOptions: { FrameOption: string };
    };
    CustomHeadersConfig: { Items: { Header: string; Value: string }[] };
  };
  const s = policy.SecurityHeadersConfig;
  const headers: Record<string, string> = {
    'Content-Security-Policy': s.ContentSecurityPolicy.ContentSecurityPolicy,
    'Referrer-Policy': s.ReferrerPolicy.ReferrerPolicy,
    'X-Frame-Options': s.FrameOptions.FrameOption,
    'X-Content-Type-Options': 'nosniff',
  };
  for (const h of policy.CustomHeadersConfig.Items) headers[h.Header] = h.Value;
  return headers;
}
