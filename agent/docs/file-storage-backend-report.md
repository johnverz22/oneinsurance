# File Storage — Backend Behaviour Report

**Date:** 2026-11-06  
**Scope:** Backend API behaviour for `/agents/files/*` endpoints  
**Environment:** `https://stage-api.oneinsurance.shop/api/v1`

---

## 1. Tag Field Is Ignored on Upload

The `POST /agents/files/upload` endpoint accepts a `tag` field in the multipart form body. The API contract implies this field is stored and returned on subsequent list calls. **It is not.**

### Observed behaviour

Upload request (multipart):
```
file       = <binary>
file_name  = "passport.jpg"
tag        = "valid_id"
```

Upload response — tag appears correct:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "file_name": "3de0c2d9111186ad2861da573d876163.webp",
    "tag": "valid_id",
    ...
  }
}
```

List response (`GET /agents/files/list`) — tag is overwritten:
```json
{
  "success": true,
  "data": [
    { "id": 10, "tag": "document", ... },
    { "id": 9,  "tag": "document", ... },
    { "id": 8,  "tag": "document", ... }
  ]
}
```

Every file in the list returns `"tag": "document"` regardless of what was sent at upload time. The upload response appears to echo back the submitted value without persisting it.

---

## 2. File Name Is Also Overwritten

The `file_name` field sent in the upload body is not preserved. The backend stores a hash-based name generated server-side (e.g. `3de0c2d9111186ad2861da573d876163.webp`), discarding the original.

This means even if the frontend sends a meaningful filename, it will be replaced. As a result, the frontend no longer sends the original client filename at all — it generates its own opaque name server-side (see Section 6).

---

## 3. List Response Shape

`GET /agents/files/list` returns a flat array under `data`:

```json
{
  "success": true,
  "data": [ { "id": 1, "file_name": "...", "tag": "document", ... } ]
}
```

Not `data.files`, not a paginated object — a plain array. This is the only confirmed shape.

---

## 4. Issues to Fix on the Backend

| # | Issue | Impact |
|---|---|---|
| 1 | `tag` field is not persisted — upload echoes it back but list always returns `"document"` | Clients cannot distinguish file types from the list endpoint |
| 2 | `file_name` is replaced with a server-generated hash | Original filename is lost; not user-friendly |
| 3 | No replace-by-tag — uploading the same tag twice creates duplicate records | Multiple files accumulate per slot with no way to identify which is current |
| 4 | No filter-by-tag on the list endpoint (or it returns all regardless) | Clients must download the entire file list and filter client-side |

---

## 5. Recommended Backend Fixes

1. **Persist the `tag` field.** Store whatever value the client sends in `tag` on the file record and return it faithfully from the list endpoint.

2. **Persist the original `file_name`.** Either store it alongside the hashed storage name, or use it as-is. The hashed name can remain the storage key on Drive, but the display name should reflect the original.

3. **Support upsert-by-tag.** When a file is uploaded with a tag that already exists for the agent, either replace the existing record or expose a dedicated replace endpoint. This prevents unbounded accumulation of files for the same slot.

4. **Expose a filter-by-tag endpoint.** `GET /agents/files/list?tag=valid_id` or `GET /agents/files/tag/valid_id` — return only files matching that tag, so clients do not need to fetch and filter the entire list.

---

## 6. Frontend Workaround (Current)

Because the backend does not persist `tag` or `file_name`, the portal encodes the document type into the filename at upload time using a double-underscore separator followed by a random 8-character hex string:

```
Format:   <tag>__<8-char random hex>.<ext>
Examples:
  valid_id__a3f9c1e7.webp
  insurance_qual_1__b72d4f01.pdf
  profile_photo__c81e4a92.jpg
```

The filename is generated **server-side** by the Next.js upload route (`/api/agent/files/upload`) using `crypto.getRandomValues`. The original client filename is intentionally discarded — it is never seen by the backend or stored anywhere. The random suffix prevents collisions between multiple uploads of the same type.

On list fetch, the frontend parses the `tag__` prefix out of `file_name` to reconstruct the tag. The random suffix is not surfaced to the user — the UI shows a static "Uploaded" label rather than any filename.

This workaround will be **removed** once the backend persists the `tag` field correctly. The filename generation and prefix parsing can then be dropped entirely.

---

## 7. File Viewing — 401 Fix

### Problem

The original "View" button was an `<a href="/api/agent/files/{id}/serve" target="_blank">`. Browser navigation (link clicks, `window.open`) cannot attach custom headers, so the `/serve` proxy received no `Authorization` header and returned **401 Unauthorized**.

### Fix

The `<a>` tag was replaced with a modal (`FileViewerModal` in `settings-client.tsx`) that:

1. Fetches the file via `authFetch` (which attaches the Bearer token).
2. Converts the response to a `Blob` and creates a local `blob:` URL.
3. Renders it inside the modal — images in `<img>`, PDFs in `<iframe>`.
4. Revokes the blob URL on modal close to avoid memory leaks.

The Google Drive URL is never exposed to the browser. All authentication remains server-side.

---

## 8. Legacy Records

All files uploaded before this workaround was in place have `tag: "document"` and no `__` prefix. They are not matched to any document slot in the portal UI and can be safely deleted from the backend at any time.
