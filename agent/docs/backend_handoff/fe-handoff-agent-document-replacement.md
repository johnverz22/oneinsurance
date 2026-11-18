# FE hand-off: the previous file when an agent replaces a document

For: front-end developers on the admin portal (the agent detail page, the document review queue).

The agent portal needs **no change**. Agents never receive the fields below.

**What changed:** when an agent uploads a new file for a tag they already have, the file it replaces is now **kept** so an admin can compare the two. Before, the old file was deleted at once, so you could not tell a first upload from a replacement, or what had been replaced.

Status (2026-11-14):

| Change | Where | Status |
|---|---|---|
| Previous file kept and exposed | PR #53 | Merged. On staging. The migration `2026_11_14_000000_add_superseded_by_to_uploaded_files_table` has run there. |

This builds on `fe-handoff-agent-document-review.md` (review status, approve and reject) and `fe-handoff-agent-files.md` (tags, one file per tag).

---

## 1. How it works

- Each tag has **one current file**. It is the one every list returns.
- When the agent uploads again for the same tag, the current file becomes the **previous file**. It is kept, **whatever its status** (`pending`, `approved` or `rejected`).
- **At most two files per tag exist:** the current one and the previous one. A third upload deletes the oldest.
- **Reviewing never deletes anything.** Approving or rejecting the new file does not remove the previous one. The comparison stays until the agent uploads again.
- The previous file is **hidden from every list**. It is never a second row for the tag, so one tag is still one slot in your UI, and `data.pagination` and the `documents` counts count current files only.
- The **new** file always starts as `pending`, as before.
- If the agent deletes the current file, the previous one is deleted with it.

## 2. New fields on the file object (administrators only)

These appear on the standard file object, wherever an admin reads one: `GET /api/v1/admin/files/user/{agentId}`, `GET /admin/files/list`, `GET /admin/files/tag/{tag}`, `GET /admin/files/{id}`, the approve and reject replies, and each entry of an agent's `files` when an admin reads the agent.

| Field | On | Value |
|---|---|---|
| `previous_file_id` | the new file | Id of the file it replaced. `null` on a first upload. |
| `previous_review_status` | the new file | `pending`, `approved` or `rejected`. `null` on a first upload. |
| `previous_review_note` | the new file | The reason it was rejected, or `null`. |
| `previous_reviewed_at` | the new file | When the previous file was decided, or `null`. |
| `previous_web_view_link` | the new file | Google Drive link to the previous file, or `null`. |
| `replaced_by_file_id` | the old file | Id of the file that replaced it. `null` on a current file. |

All six are `null` on a first upload. They are **not sent to agents**.

A replacement as an admin sees it. This is a hand-written sample; the field names and shape follow the backend:

```json
{
  "id": 52,
  "tag": "valid_id",
  "review_status": "pending",
  "review_note": null,
  "replaced_by_file_id": null,
  "previous_file_id": 47,
  "previous_review_status": "rejected",
  "previous_review_note": "The photo is blurry.",
  "previous_reviewed_at": "2026-11-12T08:30:00.000000Z",
  "previous_web_view_link": "https://drive.google.com/file/d/...",
  "...": "the other file fields, as in fe-handoff-agent-files.md"
}
```

## 3. What to show

| The new file has | Show |
|---|---|
| `previous_file_id` is `null` | **New upload** |
| `previous_review_status` is `rejected` | **Replaced a rejected document on {previous_reviewed_at}: {previous_review_note}** |
| `previous_review_status` is `approved` | **Replaced an approved document on {previous_reviewed_at}** |
| `previous_review_status` is `pending` | **Replaced a document that was never reviewed** |

Add a **Compare** action when `previous_file_id` is set. It opens the previous file next to the current one.

- The previous file's own fields are `GET /api/v1/admin/files/{previous_file_id}`. Its `replaced_by_file_id` is the current file's id.
- To **display** it inside the portal, fetch `GET /api/v1/admin/files/{previous_file_id}/download` with your bearer token and show the blob, the same way you show the current file.
- `previous_web_view_link` opens the file in Google Drive. It works only for people who have Drive access to it, so use `/download` for an in-portal preview.

## 4. Review actions

- **Approve and reject go on the new (current) file.** Use its id.
- **The previous file cannot be reviewed.** `POST /admin/files/{previous_file_id}/approve` or `/reject` returns **422** ("This file was replaced by a newer upload. Review the new one."). Do not show review buttons on it.
- After a decision, the new file's `previous_*` fields stay as they were.

## 5. Errors

| Status | When | What to do |
|---|---|---|
| 401 | No or expired token. | Send the user to sign in. |
| 403 | The caller is not an administrator. | The previous-file routes are admin only. |
| 404 | The id no longer exists. A previous file is deleted when the agent uploads a third time or deletes the current file. | Read the agent's files again, and drop the Compare view. |
| 422 | A review on a previous file. | Review the current file instead. |

A Compare view that is open while the agent uploads again can hit a 404. Handle it and refresh.

## 6. Things to know

- **Files replaced before this was deployed have no previous file.** They show as **New upload**.
- **Only one step back.** A third upload discards the oldest, so the history is the current file and the one before it. It is not a full audit trail.
- **A rejected file's note is lost when it is discarded.** Show the history while the previous file exists. If the business needs a full trail, that is a separate feature.
- **Nothing is blocked.** As before, review status does not stop an agent from being activated or selling.

## 7. Checklist

- [ ] Admin: show **New upload** or the **Replaced a {status} document** line, from `previous_file_id` and `previous_review_status`.
- [ ] Admin: a **Compare** action that opens `previous_file_id` next to the current file, using `/download` for the preview.
- [ ] Admin: for `rejected`, show `previous_review_note` and `previous_reviewed_at`.
- [ ] Admin: Approve and Reject only on the current file. Hide them on any file with `replaced_by_file_id` set.
- [ ] Handle 404 on the previous file (the agent uploaded again) and 422 on a review of an old file.
- [ ] Do not expect these fields on agent responses. They are not sent.
- [ ] Do not add a second row for the same tag. The lists return one file per tag.
- [ ] Test on staging: replace a reviewed document, open Compare, then upload a third time and check the oldest file is gone.

## 8. Questions for the backend

- Is one step back enough, or does the business need the full history of a tag?
- Should the agent also see why their last file was rejected next to the new upload? They already see the new file's own status and note today.
- Should the audit log (who decided what) be readable from the portal? There is no endpoint yet.
