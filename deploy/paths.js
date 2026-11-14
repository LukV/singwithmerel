// CloudFront Function on every request (viewer request), for both distributions.
// www.singwithmerel.com moves to singwithmerel.com; a path without a file name (/en) moves to
// its folder (/en/); a folder serves its index.html.
// Tested in deploy/paths.test.ts.
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';
  var uri = request.uri;

  if (host.indexOf('www.') === 0) return moved('https://' + host.slice(4) + uri);
  var last = uri.slice(uri.lastIndexOf('/') + 1);
  if (last !== '' && last.indexOf('.') === -1) return moved(uri + '/');
  if (uri.charAt(uri.length - 1) === '/') request.uri = uri + 'index.html';
  return request;
}

function moved(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location }, 'cache-control': { value: 'max-age=3600' } },
  };
}
