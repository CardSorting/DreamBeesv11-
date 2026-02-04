# API Key Management Reference

This document details the HTTP endpoints available for managing OpenClaw API Keys programmatically.

## Base URL
All requests should be sent to:
`https://dreambeesai.com/api`

## Authentication
These endpoints require a valid **Firebase ID Token** in the `Authorization` header.
> [!IMPORTANT]
> You cannot use an API Key to manage other API Keys. You must use a User ID Token (obtained via Firebase Auth) to create or revoke keys.

```bash
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

---

## ⚡️ Quick Start: Developer Portal (Web UI)

The easiest way to manage your keys is via the DreamBees Developer Portal.

1.  **Log in** to DreamBees.
2.  Navigate to **Settings > Developer Portal** (`/settings/developer`).
3.  Use the visual interface to Generate and Revoke keys.

---

## ⚡️ Quick Start: CLI Script

If you prefer the command line:

1.  **Run the helper**:
    ```bash
    npm run keys
    ```
    This will prompt you for your Firebase ID Token (or read `FIREBASE_TOKEN` from your `.env` file).

2.  **Power User Shortcuts**:
    You can also pass arguments directly:
    ```bash
    # List keys
    npm run keys list

    # Create a new key
    npm run keys create "My Bot Name"

    # Revoke a key
    npm run keys revoke sk_live_8f7d...
    ```
    > [!TIP]
    > On macOS, newly created keys are automatically copied to your clipboard! 📋

---

## CONCEPTS: Keys vs IDs

It is critical to distinguish between the **API Key** and the **Key ID**:

1.  **API Key (`sk_live_...`)**:
    *   **Secret**. Treat this like a password.
    *   Used to **authenticate** your agent when connecting to OpenClaw.
    *   Only shown **once** upon creation.

2.  **Key ID (`sk_live_HASH`)**:
    *   **Public (to you)**. Safe to display in your dashboard.
    *   Used to **reference** a key for management actions (like Revoking).
    *   Returned in `listApiKeys`.

---

## Endpoints

### 1. Create API Key
Generates a new, high-entropy API key.
**Important:** The raw key is returned only once. You must save it immediately.

**Action:** `createApiKey`
**Method:** `POST`

#### Request Body
```json
{
  "data": {
    "action": "createApiKey",
    "name": "My Production Bot",
    "scope": ["default", "agent:write"]
  }
}
```

#### Example `curl`
```bash
curl -X POST https://us-central1-dreambees-alchemist.cloudfunctions.net/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -d '{
    "data": {
      "action": "createApiKey",
      "name": "My Production Bot"
    }
  }'
```

#### Response
```json
{
  "result": {
    "success": true,
    "key": "sk_live_a1b2c3d4...",  // <--- SAVE THIS NOW! IT WILL NOT BE SHOWN AGAIN.
    "meta": {
      "name": "My Production Bot",
      "prefix": "sk_live_",
      "lastChars": "3d4...",
      "createdAt": "2024-05-20T10:00:00Z"
    }
  }
}
```

---

### 2. List API Keys
Retrieves all active API keys for the authenticated user.
**Note:** valid keys are never returned in full. Only metadata is provided.

**Action:** `listApiKeys`
**Method:** `POST`

#### A note on IDs
The `id` field returned here is the **Key ID**, not the Key itself. Use this `id` to revoke the key later.

#### Request Body
```json
{
  "data": {
    "action": "listApiKeys"
  }
}
```

#### Example `curl`
```bash
curl -X POST https://us-central1-dreambees-alchemist.cloudfunctions.net/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -d '{
    "data": {
      "action": "listApiKeys"
    }
  }'
```

#### Response
```json
{
  "result": {
    "keys": [
      {
        "id": "sk_live_8f7d...", // Key ID (Safe to store)
        "name": "My Production Bot",
        "lastChars": "3d4...",
        "createdAt": "2024-05-20T10:00:00Z",
        "lastUsed": "2024-06-01T12:00:00Z"
      }
    ]
  }
}
```

---

### 3. Revoke API Key
Permanently disables an API Key. This action is immediate and irreversible.

**Action:** `revokeApiKey`
**Method:** `POST`

#### Request Body
```json
{
  "data": {
    "action": "revokeApiKey",
    "keyId": "sk_live_8f7d..." // The Key ID returned from listApiKeys
  }
}
```

#### Example `curl`
```bash
curl -X POST https://us-central1-dreambees-alchemist.cloudfunctions.net/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -d '{
    "data": {
      "action": "revokeApiKey",
      "keyId": "sk_live_8f7d..."
    }
  }'
```

#### Response
```json
{
  "result": {
    "success": true
  }
}
```

---

## Errors

The API uses standard HTTP status codes and Firebase Error codes.

| Status | Code | Message | Description |
| :--- | :--- | :--- | :--- |
| `401` | `unauthenticated` | "Login required" | Missing or invalid Bearer token. |
| `403` | `permission-denied` | "Not your key" | You attempted to revoke a key that belongs to another user. |
| `404` | `not-found` | "Key not found" | The `keyId` provided does not exist or has already been revoked. |
| `400` | `invalid-argument` | "Missing action" | The request body is missing the `action` field. |

---

## Best Practices

1.  **Environment Variables**: Never hardcode your API Key in your source code. Use `.env` files.
    ```bash
    # .env
    OPENCLAW_API_KEY=sk_live_...
    ```
2.  **Key Rotation**: If you suspect a key has been leaked, **Create** a new key, update your services, and then **Revoke** the old key.
3.  **Least Privilege**: Start with default scopes. (Currently all keys have default access, but granular scopes are coming soon).

---

## Troubleshooting

### "401 Unauthenticated: Login required"
Your Firebase ID Token is missing, invalid, or expired. Tokens typically expire after 1 hour.
**Fix**: Generate a new token and retry.

### "How do I get a Firebase ID Token?"
You cannot generate one via this API. You must sign in a user via the Client SDK or Firebase CLI.
If you are developing locally, you can use the Firebase CLI:
```bash
firebase login:ci
```
This will print a **Refresh Token**. Note that for the API, you strictly need an **ID Token**.
To get an ID Token easily for testing, you can log in to the DreamBees web console, open DevTools, and look for the token in LocalStorage or Network requests.
