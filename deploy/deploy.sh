#!/usr/bin/env bash
# Upload dist/ to the site or to next, and clear CloudFront's cache.
# Used by .github/workflows/deploy.yml, and by `npm run deploy -- next|site` from a machine signed in to AWS.
# The bucket and distribution come from the environment (the repository variables), or are looked up.
set -euo pipefail

TARGET=${1:-}
case "$TARGET" in
  site) BUCKET=${SITE_BUCKET:-}; DIST=${SITE_DISTRIBUTION:-}; NAME=singwithmerel.com ;;
  next) BUCKET=${NEXT_BUCKET:-}; DIST=${NEXT_DISTRIBUTION:-}; NAME=next.singwithmerel.com ;;
  *) echo "usage: npm run deploy -- next|site" >&2; exit 1 ;;
esac

if [ -z "$BUCKET" ]; then
  ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  BUCKET="singwithmerel-$TARGET-$ACCOUNT"
fi
if [ -z "$DIST" ]; then
  DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='$NAME'].Id | [0]" --output text)
fi
[ -f dist/index.html ] || { echo "No dist/: run npm run build first." >&2; exit 1; }

echo "Deploying dist/ to $NAME (bucket $BUCKET, distribution $DIST)"

# Files with a hash in their name never change: cache them for a year.
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public, max-age=31536000, immutable" --only-show-errors
# Everything else (pages, the service worker, the manifest, icons, clips) is checked on every visit.
aws s3 sync dist "s3://$BUCKET" --exclude "assets/*" --cache-control "no-cache" --delete --only-show-errors
# Types the upload may not guess.
aws s3 cp dist/manifest.webmanifest "s3://$BUCKET/manifest.webmanifest" --content-type application/manifest+json --cache-control no-cache --only-show-errors
for dir in voice piano; do
  if ls "dist/$dir"/*.m4a >/dev/null 2>&1; then
    aws s3 cp "dist/$dir" "s3://$BUCKET/$dir" --recursive --exclude "*" --include "*.m4a" --content-type audio/mp4 --cache-control no-cache --only-show-errors
  fi
done
# Old hashed files go last, so a page that is still open finds what it asked for while the upload runs.
aws s3 sync dist/assets "s3://$BUCKET/assets" --delete --only-show-errors

ID=$(aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --query Invalidation.Id --output text)
echo "Invalidation $ID"
aws cloudfront wait invalidation-completed --distribution-id "$DIST" --id "$ID"
echo "Live on https://$NAME"
