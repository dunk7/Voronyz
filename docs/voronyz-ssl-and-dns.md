# voronyz.com SSL and DNS

## Symptom

Chrome shows:

> voronyz.com normally uses encryption to protect your information… the website sent back unusual and incorrect credentials… You cannot visit voronyz.com right now because the website uses HSTS.

That means the browser expected a valid certificate for `voronyz.com`, but the server presented a different one (usually Netlify’s default `*.netlify.app` certificate).

## Root cause (May 2026)

The site is deployed on Netlify (`voronyz` / `voronyz.netlify.app`). DNS for the apex domain is correct (`voronyz.com` → `75.2.60.5`), and the custom domain is registered in Netlify, but the **Let’s Encrypt certificate expired** (~2026-05-19) and was not renewed. Until Netlify provisions a new cert, HTTPS for `voronyz.com` will fail and HSTS will block bypassing the warning.

## Fix (choose one)

### Option A — Netlify UI (fastest)

1. Open [Netlify → voronyz → Domain management → HTTPS](https://app.netlify.com/projects/voronyz/domain-management/https).
2. Click **Renew certificate** or **Provision certificate**.
3. Wait a few minutes, then reload https://voronyz.com/

### Option B — GitHub Actions (repeatable)

1. Create a [Netlify personal access token](https://app.netlify.com/user/applications#personal-access-tokens).
2. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**  
   Name: `NETLIFY_AUTH_TOKEN`  
   Value: your token
3. Run the workflow **Renew Netlify SSL (voronyz.com)** (Actions tab → workflow → Run workflow).

The workflow calls Netlify’s SSL renew API for site `cd229aa6-16ce-4912-8da2-39b756823133` and verifies that the live cert includes `voronyz.com`.

### Option C — Local script

```bash
./scripts/check-voronyz-ssl.sh
```

## Recommended DNS (Spaceship / external DNS)

| Host | Type | Value |
|------|------|--------|
| `@` (apex) | A | `75.2.60.5` |
| `www` | CNAME | `voronyz.netlify.app` |

Remove any old apex A records (e.g. `147.75.40.150`) and any `AAAA` records.

After adding `www`, add `www.voronyz.com` as a domain alias in Netlify (Domain management → Domains).

## Verify

```bash
./scripts/check-voronyz-ssl.sh
# Expect: STATUS: OK — Certificate matches voronyz.com
```

Or:

```bash
echo | openssl s_client -connect voronyz.com:443 -servername voronyz.com 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
```

The subject / SAN must include `voronyz.com`, not only `*.netlify.app`.
