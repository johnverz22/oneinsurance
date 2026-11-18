# FE hand-off: admin review of agent documents

For: front-end developers on the admin portal (agent detail, a review queue) and the agent portal's Settings page (document slots).

New: an administrator can approve or reject each document an agent uploads. A rejection carries a reason, and the agent is emailed.

Status when written (2026-11-13):

| Change | Where | Status |
|---|---|---|
| Review status on documents, approve and reject routes, filter, counts, email | branch `feature/agent-document-review` | **Not merged, not deployed.** Needs a database migration. |

Confirm with the backend which environment has it before you test. This builds on `fe-handoff-agent-files.md` (tags, one file per tag).

---

## 1. How it works

- Every agent document has a **`review_status`**: `pending`, `approved` or `rejected`.
- A new upload starts as `pending`. Files uploaded before this change also start as `pending`.
- **A replacement upload for the same tag starts as `pending` again.** The decision belongs to the file it was made on. The agent's `id` already changes on every replacement.
- An admin can change a decision later: reject an approved file, or approve a rejected one. Approving clears the note.
- Only an **agent's documents** are reviewed. The profile photo, the front and back ID images of a proposal, and files uploaded by other roles are not. Trying to review them is a 422.
- **Nothing is blocked yet.** The status is recorded and shown. It does not stop an agent from being activated or selling.

## 2. Admin endpoints

Bearer token of an administrator (admin or superadmin), under `/api/v1`.

| Route | Body | Result |
|---|---|---|
| `POST /admin/files/{id}/approve` | none (`note` optional, ignored) | `200` with the file |
| `POST /admin/files/{id}/reject` | `note` **required**, string, max 500 | `200` with the file |

The reply is the standard file object, with the new fields:

```json
{
  "success": true,
  "message": "Document rejected",
  "data": {
    "id": 42,
    "tag": "valid_id",
    "file_name": "valid_id.jpeg",
    "original_name": "IMG_2041.JPG",
    "review_status": "rejected",
    "review_note": "The photo is blurry.",
    "reviewed_at": "2026-11-13T02:00:00.000000Z",
    "reviewed_by": 1,
    "...": "the other file fields, as in fe-handoff-agent-files.md"
  }
}
```

This is a hand-written sample. The field names and shape follow the backend.

| Status | When |
|---|---|
| 401 | No or expired token. |
| 403 | The caller is not an administrator (agents, merchants and others). |
| 404 | No such file, or it was replaced and the id is old. Read the agent's files again. |
| 422 `errors.note` | A rejection with no note, or a note over 500 characters. Show it under the reason box. |
| 422 (message only) | "Only an agent's documents can be reviewed" (profile photo, proposal ID images, non-agent files). |

Show the admin a reason box on Reject, and require it before you send.

## 3. Reading the status

New fields on **every** file object (upload, list, show, by tag, an agent's `files`):

| Field | Value |
|---|---|
| `review_status` | `pending`, `approved` or `rejected` |
| `review_note` | The admin's reason when rejected, otherwise `null` |
| `reviewed_at` | When it was decided, or `null` |
| `reviewed_by` | The admin's user id. **Administrators only.** It is not in the agent's responses. |

### Review queue

Add `review_status` to the admin file lists:

```
GET /api/v1/admin/files/user/{agentId}?review_status=pending
GET /api/v1/admin/files/list?review_status=pending
GET /api/v1/agents/files/list?review_status=rejected      (an agent's own files)
```

A value other than the three above is a 422 on `errors.review_status`. The list shape is unchanged (`data.files` and `data.pagination`).

### Counts on the agent

Wherever an agent object carries `files` (the admin agents list, the agent detail, `GET /agents/me`), it now also has `documents`:

```json
"documents": { "pending": 1, "approved": 1, "rejected": 1 }
```

Use it for a badge ("2 documents to review") on the agents list without loading each file. The profile photo is not counted.

## 4. Agent portal

- Show the status on each document slot: **Pending review**, **Approved** or **Rejected**.
- On **Rejected**, show `review_note` and ask for a new upload. Upload again with the same `tag` as before (see `fe-handoff-agent-files.md`). The new file shows as Pending review.
- The agent is also emailed when a document is rejected, with the reason. There is no email on approval.
- An approved document can still be replaced by the agent. The replacement goes back to Pending review.

## 5. Notes

- Every decision is written to an audit log (who, which file, which agent, approved or rejected). The note is kept on the file, not in the log. There is no endpoint to read the log yet.
- If the email cannot be sent, the rejection still saves. The agent will see it on the page.
- Merchant and integrator roles get 403 on the review routes, as they do on the other admin routes.

## 6. Checklist

- [ ] Admin: Approve and Reject buttons on each agent document. Reject asks for a reason first (max 500 characters).
- [ ] Admin: show `review_status`, `review_note` and `reviewed_at` on each document.
- [ ] Admin: a pending filter or queue, using `?review_status=pending`.
- [ ] Admin: a badge from `documents.pending` on the agents list.
- [ ] Handle 403 and 422 (`errors.note`) on the review calls, and 404 when the file was replaced meanwhile.
- [ ] Agent: show each slot's status, and the rejection reason on a rejected slot.
- [ ] Agent: let the user upload a replacement for a rejected slot, with the same `tag`.
- [ ] Do not read `reviewed_by` on the agent portal. It is not sent.
- [ ] Test on staging once the backend confirms the migration has run.

## 7. Questions for the backend

- Should approval gate anything, for example activating an agent only when the required documents are approved? Today it does not.
- Which tags are required (for example `valid_id`, the insurance qualification slots)? Needed if the portal shows "3 of 4 approved".
- Should approving also email the agent?
