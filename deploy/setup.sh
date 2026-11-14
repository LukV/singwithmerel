#!/usr/bin/env bash
# One-time AWS setup for singwithmerel.com (docs/architecture/decisions/010-hosting.md).
# Run step by step: `bash deploy/setup.sh <step>`, or `bash deploy/setup.sh all`.
# Each step looks first and only creates what is missing, so running it twice is safe.
# deploy/README.md explains every step.
set -euo pipefail

DOMAIN=singwithmerel.com
REPO=LukV/singwithmerel
REGION=eu-north-1
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
SITE_BUCKET="singwithmerel-site-$ACCOUNT"
NEXT_BUCKET="singwithmerel-next-$ACCOUNT"
ROLE=singwithmerel-deploy
FUNCTION=singwithmerel-paths
HERE="$(cd "$(dirname "$0")" && pwd)"
CLOUDFRONT_ZONE=Z2FDTNDATAQYW2 # the hosted zone id of every CloudFront distribution
CACHING_OPTIMIZED=658327ea-f89d-4fab-a63d-7e88639e58f6 # AWS managed cache policy

say() { printf '\n== %s\n' "$*"; }
zone_id() { aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" --query 'HostedZones[0].Id' --output text | sed 's|/hostedzone/||'; }
cert_arn() { aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" --output text; }
dist_id() { aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[0]=='$1'].Id | [0]" --output text; }
policy_id() { aws cloudfront list-response-headers-policies --type custom --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='$1'].ResponseHeadersPolicy.Id | [0]" --output text; }
oac_id() { aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='singwithmerel'].Id | [0]" --output text; }

# 1. The certificate, in us-east-1 as CloudFront requires, validated through DNS.
cert() {
  say "Certificate for $DOMAIN, www and next"
  local arn; arn=$(cert_arn)
  if [ "$arn" = "None" ]; then
    arn=$(aws acm request-certificate --region us-east-1 --domain-name "$DOMAIN" \
      --subject-alternative-names "www.$DOMAIN" "next.$DOMAIN" --validation-method DNS \
      --query CertificateArn --output text)
    sleep 10
  fi
  echo "$arn"
  local changes
  changes=$(aws acm describe-certificate --region us-east-1 --certificate-arn "$arn" \
    --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json |
    jq '{Changes: (unique_by(.Name) | map({Action: "UPSERT", ResourceRecordSet: {Name: .Name, Type: .Type, TTL: 300, ResourceRecords: [{Value: .Value}]}}))}')
  aws route53 change-resource-record-sets --hosted-zone-id "$(zone_id)" --change-batch "$changes" --query ChangeInfo.Status --output text
  echo "Waiting for validation (a few minutes)..."
  aws acm wait certificate-validated --region us-east-1 --certificate-arn "$arn"
  echo "Issued."
}

# 2. Two private buckets: the site and the candidates. Nothing is public; CloudFront reads them.
buckets() {
  for b in "$SITE_BUCKET" "$NEXT_BUCKET"; do
    say "Bucket $b"
    if ! aws s3api head-bucket --bucket "$b" 2>/dev/null; then
      aws s3api create-bucket --bucket "$b" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
    fi
    aws s3api put-public-access-block --bucket "$b" --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    aws s3api put-bucket-ownership-controls --bucket "$b" --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
    echo "ok"
  done
}

# 3. What every distribution shares: the origin access control, the path function, the headers.
edge() {
  say "Origin access control"
  if [ "$(oac_id)" = "None" ]; then
    aws cloudfront create-origin-access-control --origin-access-control-config \
      Name=singwithmerel,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3 >/dev/null
  fi
  oac_id

  say "Path function $FUNCTION"
  local etag
  if etag=$(aws cloudfront describe-function --name "$FUNCTION" --query ETag --output text 2>/dev/null); then
    etag=$(aws cloudfront update-function --name "$FUNCTION" --if-match "$etag" \
      --function-config "{\"Comment\":\"www to apex and folders to index.html\",\"Runtime\":\"cloudfront-js-2.0\"}" \
      --function-code "fileb://$HERE/paths.js" --query ETag --output text)
  else
    etag=$(aws cloudfront create-function --name "$FUNCTION" \
      --function-config "{\"Comment\":\"www to apex and folders to index.html\",\"Runtime\":\"cloudfront-js-2.0\"}" \
      --function-code "fileb://$HERE/paths.js" --query ETag --output text)
  fi
  aws cloudfront publish-function --name "$FUNCTION" --if-match "$etag" --query FunctionSummary.Status --output text

  for name in singwithmerel-site singwithmerel-next; do
    say "Response headers $name"
    local config; config=$(jq --arg name "$name" '.Name = $name' "$HERE/headers.json")
    if [ "$name" = singwithmerel-next ]; then
      config=$(echo "$config" | jq '.CustomHeadersConfig.Items += [{Header: "X-Robots-Tag", Value: "noindex", Override: true}] | .CustomHeadersConfig.Quantity = (.CustomHeadersConfig.Items | length)')
    fi
    local id; id=$(policy_id "$name")
    if [ "$id" = "None" ]; then
      aws cloudfront create-response-headers-policy --response-headers-policy-config "$config" --query ResponseHeadersPolicy.Id --output text
    else
      local tag; tag=$(aws cloudfront get-response-headers-policy --id "$id" --query ETag --output text)
      aws cloudfront update-response-headers-policy --id "$id" --if-match "$tag" --response-headers-policy-config "$config" --query ResponseHeadersPolicy.Id --output text
    fi
  done
}

# One distribution: its bucket, its names, its headers.
distribution() {
  local bucket=$1 headers=$2; shift 2
  local aliases=("$@")
  say "Distribution for ${aliases[*]}"
  local id; id=$(dist_id "${aliases[0]}")
  if [ "$id" = "None" ]; then
    local fn_arn; fn_arn=$(aws cloudfront describe-function --name "$FUNCTION" --stage LIVE --query FunctionSummary.FunctionMetadata.FunctionARN --output text)
    local config
    config=$(jq -n \
      --arg ref "$bucket-$(date +%s)" --arg origin "$bucket.s3.$REGION.amazonaws.com" --arg oac "$(oac_id)" \
      --arg cert "$(cert_arn)" --arg fn "$fn_arn" --arg cache "$CACHING_OPTIMIZED" --arg headers "$(policy_id "$headers")" \
      --argjson aliases "$(printf '%s\n' "${aliases[@]}" | jq -R . | jq -s .)" '{
        CallerReference: $ref, Comment: ($aliases[0]), Enabled: true, DefaultRootObject: "index.html",
        Aliases: {Quantity: ($aliases | length), Items: $aliases},
        Origins: {Quantity: 1, Items: [{Id: "s3", DomainName: $origin, OriginAccessControlId: $oac,
          S3OriginConfig: {OriginAccessIdentity: ""}}]},
        DefaultCacheBehavior: {TargetOriginId: "s3", ViewerProtocolPolicy: "redirect-to-https", Compress: true,
          CachePolicyId: $cache, ResponseHeadersPolicyId: $headers,
          AllowedMethods: {Quantity: 2, Items: ["GET", "HEAD"], CachedMethods: {Quantity: 2, Items: ["GET", "HEAD"]}},
          FunctionAssociations: {Quantity: 1, Items: [{EventType: "viewer-request", FunctionARN: $fn}]}},
        CustomErrorResponses: {Quantity: 1, Items: [{ErrorCode: 403, ResponsePagePath: "/index.html", ResponseCode: "404", ErrorCachingMinTTL: 60}]},
        ViewerCertificate: {ACMCertificateArn: $cert, SSLSupportMethod: "sni-only", MinimumProtocolVersion: "TLSv1.2_2021"},
        PriceClass: "PriceClass_100", HttpVersion: "http2and3", IsIPV6Enabled: true}')
    id=$(aws cloudfront create-distribution --distribution-config "$config" --query Distribution.Id --output text)
  fi
  echo "$id"

  # Only this distribution may read the bucket.
  aws s3api put-bucket-policy --bucket "$bucket" --policy "$(jq -n --arg b "$bucket" --arg src "arn:aws:cloudfront::$ACCOUNT:distribution/$id" '{
    Version: "2012-10-17",
    Statement: [{Sid: "CloudFrontReads", Effect: "Allow", Principal: {Service: "cloudfront.amazonaws.com"},
      Action: "s3:GetObject", Resource: "arn:aws:s3:::\($b)/*", Condition: {StringEquals: {"AWS:SourceArn": $src}}}]}')"

  # The names point at it, over IPv4 and IPv6.
  local domain; domain=$(aws cloudfront get-distribution --id "$id" --query Distribution.DomainName --output text)
  local changes
  changes=$(printf '%s\n' "${aliases[@]}" | jq -R . | jq -s --arg target "$domain" --arg zone "$CLOUDFRONT_ZONE" '{Changes: [.[] as $n | ("A", "AAAA") as $t |
    {Action: "UPSERT", ResourceRecordSet: {Name: $n, Type: $t, AliasTarget: {HostedZoneId: $zone, DNSName: $target, EvaluateTargetHealth: false}}}]}')
  aws route53 change-resource-record-sets --hosted-zone-id "$(zone_id)" --change-batch "$changes" --query ChangeInfo.Status --output text
}

distributions() {
  distribution "$SITE_BUCKET" singwithmerel-site "$DOMAIN" "www.$DOMAIN"
  distribution "$NEXT_BUCKET" singwithmerel-next "next.$DOMAIN"
}

# 4. GitHub's OIDC provider and the deploy role: only this repository's version tags may assume it,
# and it may only write these two buckets and invalidate these two distributions.
role() {
  say "GitHub OIDC provider"
  local provider="arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
  if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$provider" >/dev/null 2>&1; then
    aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com >/dev/null
  fi
  echo "$provider"

  say "Role $ROLE"
  local trust
  trust=$(jq -n --arg p "$provider" --arg repo "$REPO" '{
    Version: "2012-10-17",
    Statement: [{Effect: "Allow", Principal: {Federated: $p}, Action: "sts:AssumeRoleWithWebIdentity",
      Condition: {
        StringEquals: {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
        StringLike: {"token.actions.githubusercontent.com:sub": "repo:\($repo):ref:refs/tags/v*"}}}]}')
  if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
    aws iam update-assume-role-policy --role-name "$ROLE" --policy-document "$trust"
  else
    aws iam create-role --role-name "$ROLE" --assume-role-policy-document "$trust" \
      --description "Deploys singwithmerel.com from GitHub Actions on version tags" --max-session-duration 3600 >/dev/null
  fi
  local site next
  site=$(dist_id "$DOMAIN"); next=$(dist_id "next.$DOMAIN")
  aws iam put-role-policy --role-name "$ROLE" --policy-name deploy --policy-document "$(jq -n \
    --arg s "$SITE_BUCKET" --arg n "$NEXT_BUCKET" \
    --arg ds "arn:aws:cloudfront::$ACCOUNT:distribution/$site" --arg dn "arn:aws:cloudfront::$ACCOUNT:distribution/$next" '{
    Version: "2012-10-17",
    Statement: [
      {Sid: "List", Effect: "Allow", Action: "s3:ListBucket", Resource: ["arn:aws:s3:::\($s)", "arn:aws:s3:::\($n)"]},
      {Sid: "Write", Effect: "Allow", Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], Resource: ["arn:aws:s3:::\($s)/*", "arn:aws:s3:::\($n)/*"]},
      {Sid: "Invalidate", Effect: "Allow", Action: ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"], Resource: [$ds, $dn]}]}')"
  aws iam get-role --role-name "$ROLE" --query Role.Arn --output text
}

# 5. The repository variables the deploy workflow reads. Names and ids only: nothing secret.
variables() {
  say "Repository variables on $REPO"
  gh variable set AWS_ROLE_ARN --repo "$REPO" --body "arn:aws:iam::$ACCOUNT:role/$ROLE"
  gh variable set AWS_REGION --repo "$REPO" --body "$REGION"
  gh variable set SITE_BUCKET --repo "$REPO" --body "$SITE_BUCKET"
  gh variable set NEXT_BUCKET --repo "$REPO" --body "$NEXT_BUCKET"
  gh variable set SITE_DISTRIBUTION --repo "$REPO" --body "$(dist_id "$DOMAIN")"
  gh variable set NEXT_DISTRIBUTION --repo "$REPO" --body "$(dist_id "next.$DOMAIN")"
  gh variable list --repo "$REPO"
}

case "${1:-}" in
  cert | buckets | edge | distributions | role | variables) "$1" ;;
  all) cert; buckets; edge; distributions; role; variables ;;
  *) echo "usage: bash deploy/setup.sh cert|buckets|edge|distributions|role|variables|all" >&2; exit 1 ;;
esac
