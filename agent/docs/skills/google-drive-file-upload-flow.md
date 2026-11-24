# Skill: Google Drive–backed File Upload & Viewer

**Applies to:** UnoSure agent portal (Next.js App Router)  
**Last updated:** 2026-11-06

---

## Overview

All agent files (verification documents and profile photos) are stored on Google Drive via the UnoSure backend. Because Drive URLs require auth cookies that are not available in the browser, every upload and download is proxied through Next.js API routes that inject the agent's Bearer token.

This skill covers:
- How to upload a file through the Next.js proxy
- How tags are encoded because the backend ignores them
- How to list and display uploaded files
- How to view a file in a modal without exposing Drive URLs or triggering 401s

---

## Architecture

```
Browser  →  Next.js API routes  →  Backend (stage-api.oneinsurance.shop)  →  Google Drive
```

No file ever touches the Next.js server filesystem. All routes are pure proxies that stream bytes.

---

## File Tags

Every file belongs to one of these tags (snake_case):

| Tag | Purpose |
|-----|---------|
| `profile_photo` | Agent profile picture |
| `valid_id` | Government-issued photo ID or passport |
| `insurance_qual_1` | Qualification certificate — Tier 1 |
| `insurance_qual_2` | Qualification certificate — Tier 2 |
| `insurance_qual_3` | Qualification certificate — Tier 3 |
| `agent_license` | Authority-issued agent licence or registration |

Tags are defined as the `FileTag` union in `src/types/agent/profile.ts`.

---

## Backend Quirk: Tag and Filename Are Ignored

The backend ignores both `tag` and `file_name` on upload:
- The upload response echoes them back, giving the appearance they were saved.
- The list endpoint (`GET /agents/files/list`) always returns `tag: "document"` for every record.
- `file_name` is replaced with a server-generated hash.

**Workaround:** the tag is encoded into the filename using the pattern `<tag>__<8-char random hex>.<ext>`. The filename is generated server-side by the Next.js upload route; the original client filename is discarded. On list fetch, `normaliseFile()` parses the prefix back out to reconstruct the tag.

This workaround lives entirely in:
- `src/app/api/agent/files/upload/route.ts` — generates the filename
- `src/app/api/agent/files/route.ts` — parses the prefix on list
- `src/app/api/agent/profile/photo/route.ts` — same pattern for profile photos

It should be removed once the backend persists `tag` correctly.

---

## API Routes

### `POST /api/agent/files/upload`

Proxies a multipart upload to `POST /agents/files/upload` on the backend.

**Request body (multipart/form-data):**

| Field | Type | Notes |
|-------|------|-------|
| `file` | `File` | Required. Max 10 MB. Accepted: JPG, PNG, WEBP, GIF, AVIF, PDF |
| `tag` | `string` | Required. One of the `FileTag` values above |
| `folder_id` | `string` | Optional |

Do **not** send `file_name` — the route generates it server-side.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "file_name": "",
    "tag": "valid_id",
    "mime_type": "image/webp",
    "status": "pending",
    "web_view_link": "https://drive.google.com/...",
    "created_at": "2026-11-06T03:24:00.000Z"
  }
}
```

**Filename generated:**
```
valid_id__a3f9c1e7.webp
```
Extension is derived from MIME type first, then from the original filename, falling back to `bin`.

---

### `GET /api/agent/files`

Lists all files for the authenticated agent.

**Query params (all optional):**

| Param | Default | Notes |
|-------|---------|-------|
| `tag` | — | Filter by tag. Routes to `/agents/files/tag/{tag}` upstream |
| `folder_id` | — | Filter by folder |
| `limit` | `50` | |
| `page` | `1` | |

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 42, "file_name": "", "tag": "valid_id", "status": "pending", ... }
  ]
}
```

`file_name` is always `""` — the tag prefix has been parsed out and the random suffix is discarded. The UI displays a static "Uploaded" label, never the filename.

---

### `GET /api/agent/files/[id]/serve`

Authenticated binary proxy. Fetches `GET /agents/files/{id}/download` from the backend and streams the raw bytes back to the caller.

**Auth:** Bearer token must be in the `Authorization` request header. The browser cannot provide this via a plain `<a href>` or `<img src>` — always use `authFetch` or `useAuthenticatedImage`.

**Response:** Raw file bytes with `Content-Type` from upstream. Cached for 1 hour (`private, max-age=3600`).

---

### `DELETE /api/agent/files/[id]`

Deletes a file record from the backend.

---

### `POST /api/agent/profile/photo`

Specialised upload route for the profile photo. Accepts `photo` (not `file`) in the form body. Generates `profile_photo__<hex>.ext`, uploads to the files endpoint, then patches `profile_photo_url` on the agent profile to the proxy path `/api/agent/files/{id}/serve`.

**Request body (multipart/form-data):**

| Field | Type | Notes |
|-------|------|-------|
| `photo` | `File` | Required. Max 5 MB. Images only |

---

## Uploading a File — Client Code Pattern

```tsx
const authFetch = useAuthFetch()

const uploadMutation = useMutation({
  mutationFn: async ({ file, tag }: { file: File; tag: string }) => {
    const form = new FormData()
    form.append('file', file)
    form.append('tag', tag)
    // Do NOT send file_name — upload route generates it server-side

    const res = await authFetch('/api/agent/files/upload', {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error((await res.json())?.message || 'Upload failed')
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['agent-files'] })
    queryClient.refetchQueries({ queryKey: ['agent-files'] })
  },
})
```

---

## Listing Files — Client Code Pattern

```tsx
const { data: documents = [] } = useQuery<AgentFile[]>({
  queryKey: ['agent-files'],
  queryFn: async () => {
    const res = await authFetch('/api/agent/files')
    if (!res.ok) throw new Error('Failed to load documents')
    return (await res.json()).data ?? []
  },
})

// Find the file for a specific slot
const uploaded = documents.find(
  (d) => d.tag?.toLowerCase() === 'valid_id'
)
```

---

## Viewing a File in a Modal (Not a New Tab)

**Why not `<a href target="_blank">`:**  
The `/serve` route requires `Authorization` in the request header. Browser navigation (link clicks, `window.open`) cannot set custom headers — the route returns **401**.

**Correct approach:** fetch the file as a blob via `authFetch`, create a local `blob:` URL, and render it inside a modal.

```tsx
function FileViewerModal({ file, onClose, authFetch }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [mimeType, setMimeType] = useState('')

  useEffect(() => {
    if (!file) return
    let revoked = false

    authFetch(`/api/agent/files/${file.id}/serve`)
      .then(async (res) => {
        const blob = await res.blob()
        if (!revoked) {
          setMimeType(blob.type)
          setBlobUrl(URL.createObjectURL(blob))
        }
      })

    return () => {
      revoked = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [file])

  const isImage = mimeType.startsWith('image/')
  const isPdf   = mimeType === 'application/pdf'

  return (
    <Modal open={!!file} onClose={onClose} title="Document preview">
      {isImage && <img src={blobUrl} alt="document" className="max-h-[70vh]" />}
      {isPdf   && <iframe src={blobUrl} className="h-[70vh] w-full" />}
    </Modal>
  )
}
```

Always revoke the blob URL on close — failing to do so leaks memory.

---

## Profile Photo in `<img>`

Direct `<img src={user.profile_photo_url}>` will 401 because the URL is a proxy path (`/api/agent/files/{id}/serve`) requiring auth. Use `useAuthenticatedImage`:

```tsx
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'

const src = useAuthenticatedImage(user?.profile_photo_url)

return src
  ? <img src={src} alt="Profile" className="size-20 rounded-full" />
  : <FallbackAvatar />
```

The hook:
- Skips auth for plain `http/https` URLs (non-proxy).
- Fetches proxy URLs with the Bearer token, creates a blob URL, and revokes it on unmount.

---

## Adding a New File Type

1. Add the tag to `FileTag` in `src/types/agent/profile.ts`.
2. Add the slot to `REQUIRED_DOCUMENTS` in `settings-client.tsx` with the matching `tag`.
3. No changes needed to the upload or list routes — they are tag-agnostic.

---

## Removing the Workaround (When Backend Is Fixed)

Once the backend persists `tag` and `file_name` correctly:

1. In `upload/route.ts` — stop generating the `tag__hex.ext` filename; send `file_name: file.name` or omit it.
2. In `profile/photo/route.ts` — same; revert to a plain filename.
3. In `files/route.ts` `normaliseFile()` — remove the `__` prefix parsing; use `f.tag` directly.
4. In `settings-client.tsx` — no changes needed (it already doesn't depend on the filename).
5. Delete this section from the skill doc and from `file-storage-backend-report.md`.
