# Domain & DNS Guide for OpenClaw API

This guide explains how to configure your Custom Domain (`dreambeesai.com`) to serve the API, and how to manage DNS records in Cloudflare.

## 1. The Recommended Approach (Path-Based)

The simplest and most performant way to host your API is to serve it from the **same domain** as your notification app, under the `/api` path.

**URL**: `https://dreambeesai.com/api`

### Why?
- **Zero CORS Issues**: Frontend and Backend share the origin.
- **Shared Cookies**: Authentication cookies work seamlessly.
- **Single SSL Cert**: No need to manage multiple certificates.

### Configuration
We have already updated `firebase.json` to handle this:
```json
"rewrites": [
  {
    "source": "/api/**",
    "function": "api"
  }
]
```
*No Cloudflare changes are required for this method if `dreambeesai.com` is already working.*

---

## 2. The Subdomain Approach (`api.dreambeesai.com`)

If you strictly require a separate subdomain (e.g., `api.dreambeesai.com`), follow these steps.

### Step A: Configure Firebase
1.  Go to the **Firebase Console > Hosting**.
2.  Scroll to the **Advanced** section (or "Sites").
3.  Click **Add another site**.
    - Site ID: `dreambees-api` (example).
4.  In your local project, update `firebase.json` to target this site:
    ```json
    {
      "hosting": [
        {
          "target": "main",
          "public": "dist",
          ...
        },
        {
          "target": "api",
          "public": "public-api",
          "rewrites": [{ "source": "**", "function": "api" }]
        }
      ]
    }
    ```
5.  Link directories using `.firebaserc`:
    ```json
    {
      "targets": {
        "dreambees-alchemist": {
          "hosting": {
            "main": ["dreambees-alchemist"],
            "api": ["dreambees-api"]
          }
        }
      }
    }
    ```

### Step B: Connect Domain
1.  In Firebase Hosting (for the new `dreambees-api` site), click **Add verification custom domain**.
2.  Enter `api.dreambeesai.com`.
3.  Firebase will give you **TXT** records to verify ownership.

### Step C: Cloudflare DNS Configuration
Once verified, Firebase will provide the **A** records or **CNAME** target. Since you are using Cloudflare:

1.  Login to **Cloudflare Dashboard**.
2.  Select `dreambeesai.com`.
3.  Go to **DNS > Records**.
4.  Click **Add Record**.
5.  **Type**: `CNAME` (or `A` records if Firebase provides IPs).
    - **Name**: `api` (which resolves to `api.dreambeesai.com`)
    - **Target**: `dreambees-alchemist.web.app` (or the specific site URL provided by Firebase).
    - **Proxy Status**: `Proxied` (Orange Cloud) is recommended for DDoS protection, but `DNS Only` (Grey Cloud) may be required for SSL verification initially.
6.  Save.

---

## 3. Troubleshooting

**Q: I get a 404 on `/api/v1/...`**
A: Ensure you deployed the latest config: `firebase deploy --only hosting`.

**Q: Cloudflare SSL Handshake Failure**
A: Ensure your SSL/TLS encryption mode in Cloudflare is set to **Full** or **Full (Strict)**. Firebase Hosting forces HTTPS, so "Flexible" mode will cause redirect loops or errors.
