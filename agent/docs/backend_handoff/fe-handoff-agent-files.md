# FE hand-off: agent file storage (`/agents/files/*`)

For: front-end developers on the agent portal's Settings page (document slots, file viewer).

This answers `file-storage-backend-report.md` (2026-11-06). All four backend issues in it are fixed, so you can remove the filename workaround in its section 6. Two statements in that report no longer hold, see section 3.

Status when written (2026-11-12):

| Change | PR | Status |
|---|---|---|
| `tag` saved and returned; one file per tag; filter by tag; PDF and photos only; share and make-public admin-only | [#34](https://github.com/nelszy/one-insurance/pull/34) | Merged |
| Agent files grouped on Drive by user (folder layout, profile photo) | [#31](https://github.com/nelszy/one-insurance/pull/31) | Merged |
| Backfill of old `<tag>__<hex>.<ext>` files (command) | in #34 | Merged. **Run status on each environment: ask the backend.** |

Merged does not mean deployed. Test against staging, and confirm with the backend that the backfill has run there before you delete the old parsing code (section 6).

---

## 1. What changed, against the report

| Report issue | Now |
|---|---|
| 1. `tag` not persisted, list always returns `"document"` | `tag` is **required** on an agent upload, saved, and returned on upload, list, show and by-tag. |
| 2. `file_name` replaced by a hash | The stored name is `{tag}.{ext}`, for example `valid_id.jpeg`. The user's own file name is kept in **`original_name`**. |
| 3. Same tag twice makes duplicates | **One file per tag.** A new upload replaces the old one. |
| 4. No filter by tag | `GET /agents/files/list?tag=valid_id`, or `GET /agents/files/tag/valid_id`. |

Also new, not in the report:

- Agents can upload **PDF, JPG, PNG and WebP only**, up to **5 MB**. The type is checked on the real file, not the name.
- `profile_photo`, `front_id` and `back_id` are reserved tags and are rejected.
- `POST /agents/files/{id}/share` and `/public` return `403` for agents.
- An agent can only read, download or delete their own files.

## 2. Endpoints

All use the agent's bearer token, under `/api/v1`.

| Route | What it does |
|---|---|
| `POST /agents/files/upload` | Upload a document for a tag. |
| `GET /agents/files/list` | My files. Optional `tag`, `limit` (default 50), `page`. |
| `GET /agents/files/tag/{tag}` | My files with that tag. Same as `list?tag=`. |
| `GET /agents/files/{id}` | One file's details. |
| `GET /agents/files/{id}/download` | The file itself. Use this to show it. |
| `DELETE /agents/files/{id}` | Remove a file. |

`tag` is also on each entry of `files` in `GET /agents/me`. The profile photo is not in that list; it has its own endpoints (see `agent-profile-photo-fe.md`).

### Upload

`multipart/form-data`:

| Field | Required | Rules |
|---|---|---|
| `file` | yes | PDF, JPG, JPEG, PNG or WebP. Max 5 MB. |
| `tag` | yes | The document slot. Lowercase letters, numbers and underscores, max 64. For example `valid_id`, `insurance_qual_1`. Not `profile_photo`, `front_id` or `back_id`. |
| `file_name`, `folder_id` | no | **Ignored for agents.** Stop sending them. |

Success is `201`:

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 42,
    "file_id": "1AbC...",
    "file_name": "valid_id.jpeg",
    "original_name": "IMG_2041.JPG",
    "tag": "valid_id",
    "mime_type": "image/jpeg",
    "size": 183204,
    "folder_id": "1XyZ...",
    "web_view_link": "https://drive.google.com/...",
    "web_content_link": "https://drive.google.com/...",
    "is_public": false,
    "created_at": "2026-11-11T02:00:00.000000Z",
    "updated_at": "2026-11-11T02:00:00.000000Z",
    "created_time": "2026-11-11T02:00:00+00:00"
  }
}
```

This is a hand-written sample. The field names and shape follow the backend.

- **Do not show `web_view_link` or `web_content_link`.** They are private Drive links. Read the file through `/download` with the token, as the viewer modal does now.
- `created_time` is only on the upload reply. The other responses have `created_at`.

### Replacing a document

Upload again with the same `tag`. The new file is saved first and the old one is removed after, so a failed upload keeps the current document.

**The `id` and `file_id` change on every replacement.** Do not keep an id between uploads. After an upload, use the `id` in the reply, or read the list again.

### List

```
GET /api/v1/agents/files/list?tag=valid_id
```

```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [ { "id": 42, "tag": "valid_id", "file_name": "valid_id.jpeg", "...": "same fields as above, without created_time" } ],
    "pagination": { "total": 1, "count": 1, "per_page": 50, "current_page": 1, "last_page": 1 }
  }
}
```

- Newest first. With one file per tag, a tag filter returns zero or one file.
- The page size parameter is `limit`, not `per_page`.
- `GET /agents/files/tag/{tag}` has the same shape plus `data.tag`.

## 3. Differences from the report

| The report says | What the backend does |
|---|---|
| The list is a flat array under `data` ("the only confirmed shape") | It is an object: **`data.files`** plus **`data.pagination`**. If the app reads `data` as an array, adapt it. |
| The upload reply echoes `tag` without saving it | The tag is saved. The reply and the list agree. |
| Sending `file_name` could set the stored name | `file_name` is ignored for agents. The stored name is always `{tag}.{ext}`. |

## 4. Errors

| Status | When | What to do |
|---|---|---|
| 401 | No or expired token. | Sign in again. |
| 403 | Another agent's file, or share/make-public as an agent. | Do not offer those actions. |
| 404 | The file does not exist, or was replaced and the id is old. | Read the list again. |
| 422 `errors.tag` | Missing, not a slug, over 64 characters, or reserved. | Show under the form. The slot names are fixed by the app, so a user rarely sees this. |
| 422 `errors.file` | "The file must be a PDF, JPG, PNG or WebP." or "The file size must not exceed 5MB." | Show under the upload field. Check type and size in the browser first. |
| 500 | Google Drive could not take the file. The current file is unchanged. | "Could not save the document, please try again." |

## 5. Showing a file and its name

- Fetch `GET /agents/files/{id}/download` with the token, turn the response into a blob and render it (image in `<img>`, PDF in `<iframe>`), as the viewer modal does now. Revoke the blob URL on close.
- `file_name` is the storage name (`valid_id.jpeg`). It is not a label for the user.
- `original_name` is what the user's file was called. Show it if you want to show a name.
- **Files from before this change.** Their `original_name` is probably the opaque name the portal generated (`valid_id__a3f9c1e7.webp`), because the portal never sent the real name. Do not show it for those. Keep the static "Uploaded" label for any file whose `original_name` still contains `__`.

## 6. Remove the filename workaround

Once the backend confirms the backfill has run on your environment:

- Stop generating `<tag>__<8 hex>.<ext>` in the Next.js upload route. Send the real file with a `tag`.
- Stop parsing the `tag__` prefix from `file_name`. Read `tag` from the response.
- Stop downloading the whole list and filtering it. Use `?tag=`.

**Until then, keep reading both formats:** use `tag` when it is set, and fall back to the prefix when it is `null`.

What the backfill does: for each agent and tag, the newest old file gets its tag, is renamed `{tag}.{ext}` and is moved into the agent's documents folder. Older files for the same tag are removed. Files with no tag and no `tag__hex` name (the old `"document"` entries) are left alone. They match no slot, as before. They are not deleted yet.

## 7. Checklist

- [ ] Send `tag` and the real file on every agent upload. Stop sending `file_name` and `folder_id`.
- [ ] Accept only PDF, JPG, PNG and WebP in the file picker, and check the 5 MB limit in the browser.
- [ ] After an upload, use the `id` in the reply. Never reuse an old id.
- [ ] Read the list from `data.files` and the paging from `data.pagination`.
- [ ] Use `?tag=` to find a slot's file instead of filtering the whole list.
- [ ] Read `tag` from the response. Keep the `tag__` prefix fallback until the backfill is confirmed.
- [ ] Show files through `/download` with the token. Never show the Drive links.
- [ ] Show 422 errors under the field they name, and the 500 as a retry message.
- [ ] Remove any share or make-public call from the agent portal.
- [ ] Test on staging.

## 8. Questions for the backend

- Has the backfill command run on staging, and when does production get it?
- Should the old `"document"` entries be deleted? Today they stay and match no slot.
