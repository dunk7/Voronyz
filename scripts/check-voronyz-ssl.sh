#!/usr/bin/env bash
# Quick SSL/DNS diagnostic for voronyz.com (Netlify-hosted).
set -euo pipefail

DOMAIN="${1:-voronyz.com}"
LB_IP="75.2.60.5"

echo "=== DNS (A record for ${DOMAIN}) ==="
if command -v host >/dev/null 2>&1; then
  host "${DOMAIN}" || true
else
  getent hosts "${DOMAIN}" || true
fi

echo
echo "=== TLS certificate presented for ${DOMAIN} ==="
subject=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null \
  | openssl x509 -noout -subject -dates -ext subjectAltName 2>/dev/null || true)
if [[ -z "${subject}" ]]; then
  echo "Could not read certificate."
  exit 1
fi
echo "${subject}"

echo
if echo "${subject}" | grep -q "netlify.app"; then
  echo "STATUS: BROKEN — Netlify is serving the default *.netlify.app certificate."
  echo "Fix: Netlify → voronyz → Domain management → HTTPS → Renew/Provision certificate"
  echo "     Or run the GitHub workflow .github/workflows/reprovision-netlify-ssl.yml"
  echo "     (requires NETLIFY_AUTH_TOKEN repository secret)."
  exit 2
fi

if echo "${subject}" | grep -q "${DOMAIN}"; then
  echo "STATUS: OK — Certificate matches ${DOMAIN}."
  exit 0
fi

echo "STATUS: UNKNOWN — Review certificate output above."
exit 1
