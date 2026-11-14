import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Result = { uri?: string; statusCode?: number; headers?: { location?: { value: string } } };

// deploy/paths.js runs in CloudFront, not as a module; load it as CloudFront does, by its `handler`.
const source = readFileSync(join(import.meta.dirname, 'paths.js'), 'utf8');
const handler = new Function(`${source}; return handler;`)() as (event: unknown) => Result;
const visit = (uri: string, host = 'singwithmerel.com') => handler({ request: { uri, headers: { host: { value: host } } } });

describe('the CloudFront path function', () => {
  it('serves a folder by its index.html', () => {
    expect(visit('/').uri).toBe('/index.html');
    expect(visit('/fr/').uri).toBe('/fr/index.html');
    expect(visit('/nl/privacy/').uri).toBe('/nl/privacy/index.html');
  });

  it('moves a folder without its slash to the folder', () => {
    expect(visit('/en')).toMatchObject({ statusCode: 301, headers: { location: { value: '/en/' } } });
    expect(visit('/fr/privacy')).toMatchObject({ statusCode: 301, headers: { location: { value: '/fr/privacy/' } } });
  });

  it('leaves files alone', () => {
    expect(visit('/assets/index-abc.js').uri).toBe('/assets/index-abc.js');
    expect(visit('/voice/do-C4.m4a').uri).toBe('/voice/do-C4.m4a');
  });

  it('moves www to the bare domain, keeping the path', () => {
    expect(visit('/fr/', 'www.singwithmerel.com')).toMatchObject({
      statusCode: 301,
      headers: { location: { value: 'https://singwithmerel.com/fr/' } },
    });
  });
});
