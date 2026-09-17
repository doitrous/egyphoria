#!/usr/bin/env bash
# Phase 0 smoke test, run against a running `npm start`:
#
#   npm run build && SEO_HUB_SECRET=demo-secret npm start &
#   ./scripts/smoke.sh http://localhost:3000
#
# The runtime must tolerate a hub that is unreachable (SEO_HUB_URL unset) — every check here
# passes on a cold store with no hub configured at all.
set -euo pipefail

BASE="${1:-http://localhost:3000}"
SECRET="${SEO_HUB_SECRET:-}"
FAILED=0

check() {
  local label="$1" method="$2" path="$3" expect="$4" auth="${5:-}"
  local args=(-s -o /dev/null -w '%{http_code}' -X "$method")
  [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
  local code
  code=$(curl "${args[@]}" "$BASE$path" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "PASS — $label ($code)"
  else
    echo "FAIL — $label (got $code, want $expect)"
    FAILED=1
  fi
}

check "home page"           GET "/en"                        200
check "robots.txt"          GET "/robots.txt"                200
check "sitemap.xml"         GET "/sitemap.xml"                200
check "health w/o bearer"   GET "/api/seo/health"             401
if [[ -n "$SECRET" ]]; then
  check "health w/ bearer"  GET "/api/seo/health"             200 "$SECRET"
else
  echo "SKIP — health w/ bearer (SEO_HUB_SECRET not set)"
fi
check "help index"          GET "/help"                        200
check "one help entry"      GET "/help/does-not-exist"        404
check "editorial guidelines" GET "/editorial-guidelines"       200
check "tools index"         GET "/tools"                        200
check "trip-cost tool"      GET "/tools/trip-cost"           200
check "trip-cost embed"     GET "/tools/trip-cost/embed"     200
# Other sites iframe /tools/*/embed; a site-wide X-Frame-Options or frame-ancestors would break every embed.
if curl -sI "$BASE/tools/trip-cost/embed" | grep -qi '^x-frame-options\|frame-ancestors'; then
  echo "FAIL — embed route sends a framing restriction"; FAILED=1
else
  echo "PASS — embed route is frameable"
fi

# helpIndexBodyHtml's search box, on /help via the shared core-js helper.
if curl -s "$BASE/help" | grep -q 'seo-help-search'; then
  echo "PASS — /help renders the shared helpIndexBodyHtml"
else
  echo "FAIL — /help is missing the shared helper's search box"; FAILED=1
fi

# 01-site-setup.md §5: the share block on a [lang] page (home) and a content page (a tool).
for path in /en /tools/trip-cost; do
  if curl -s "$BASE$path" | grep -q 'class="seo-share"'; then
    echo "PASS — share block present on $path"
  else
    echo "FAIL — share block missing on $path"; FAILED=1
  fi
done

# CONTRACT.md: the embed view stays a minimal iframe-able page — never the share block.
if curl -s "$BASE/tools/trip-cost/embed" | grep -q 'seo-share'; then
  echo "FAIL — share block present on the tool embed"; FAILED=1
else
  echo "PASS — share block absent on the tool embed"
fi

# V2-PHASE-8: hreflang on the home page ([lang]'s own alternates) and /help (localeFreeAlternates,
# since /help has no stored page record for resolveSeo to group alternates from). Next's
# metadata API renders the attribute as `hrefLang`, not lowercase `hreflang` — match either.
for path in /en /help; do
  if curl -s "$BASE$path" | grep -qi '<link rel="alternate" hreflang='; then
    echo "PASS — hreflang present on $path"
  else
    echo "FAIL — hreflang missing on $path"; FAILED=1
  fi
done

exit $FAILED
