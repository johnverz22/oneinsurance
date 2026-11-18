# FE hand-off: an agent updates their own profile

For: front-end developers on the agent portal's profile / account settings page.

**New endpoint: `PUT /api/v1/agents/me`.** Before this, an agent had no way to edit their own profile. The old `PUT /agents/update-profile` route was removed some time ago and nothing replaced it, so a profile page that called it got 404 or 405.

Status when written (2026-11-13):

| Change | Where | Status |
|---|---|---|
| `PUT /agents/me` | branch `feature/agent-update-own-profile` | **Not merged, not deployed.** No database migration needed. |

Confirm with the backend which environment has it before you test.

An admin editing an agent is a different route (`PUT /admin/agents/{id}`) and is not changed by this.

---

## 1. Request

```
PUT /api/v1/agents/me
Authorization: Bearer <agent token>
Content-Type: application/json
```

```json
{
  "first_name": "Maria",
  "last_name": "Santos",
  "phone": "+63 917 123 4567",
  "designation": "Senior Agent"
}
```

No id in the path. The backend always updates the signed-in agent, so an agent cannot edit anyone else.

| Field | Rule |
|---|---|
| `first_name` | Optional. 1 to 100 characters. Cannot be empty or `null`. |
| `last_name` | Optional. 1 to 100 characters. Cannot be empty or `null`. |
| `phone` | Optional. Digits, spaces, brackets and dashes, with an optional leading `+`. 6 to 20 characters. Send `null` to clear it. |
| `designation` | Optional. Up to 100 characters. Send `null` to clear it. |

- **Send only what changed.** A field you leave out is not touched.
- **`phone` and `designation` can be cleared** by sending `null`. The names cannot.
- **The email cannot be changed here.** It is the login, and changing it needs verification. If you send `email`, it is ignored, with no error. Show the email as read-only.
- **`role`, `status`, `password` and `id` are ignored** if sent. Password has its own flow.
- Phone examples that pass: `+639171234567`, `(02) 8123-4567`. A phone with letters or symbols such as `<` fails.

## 2. Response

Success is `200`. It is the **same agent object as `GET /api/v1/agents/me`**, so you can replace what the page holds with `data` instead of calling `GET /agents/me` again:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 7,
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "+63 917 123 4567",
    "designation": "Senior Agent",
    "status": "active",
    "settings": { "...": "..." },
    "bank_details": [],
    "ewallets": [],
    "line_of_businesses": [],
    "profile_photo": null,
    "documents": { "pending": 0, "approved": 0, "rejected": 0 },
    "files": []
  }
}
```

This is a hand-written sample. The field names follow the existing `GET /agents/me` response, trimmed here.

- **`name`** is the first and last name joined. There are no separate first and last name fields in the object. Keep the form values for editing.

## 3. Errors

| Status | When | What to show |
|---|---|---|
| 401 | No or expired token. | Send the user to sign in. |
| 403 | The token is not an agent's (an admin or another role). | Do not call this from the admin portal. |
| 422 | A field failed. The messages are under `errors`, for example `errors.phone` or `errors.first_name`. | Show each message next to its field. |
| 500 | "Failed to update profile". An unexpected error. | A retry message. |

422 looks like:

```json
{
  "message": "The phone number may only contain digits, spaces, brackets and dashes, with an optional leading +.",
  "errors": { "phone": ["The phone number may only contain digits, spaces, brackets and dashes, with an optional leading +."] }
}
```

## 4. Notes

- **Check the same rules in the form** (lengths, the phone pattern) so most users never see a 422.
- **Profile photo** has its own endpoints (`POST`, `GET` and `DELETE /agents/profile-photo`). Do not send a photo here.
- **Bank accounts and e-wallets** are separate too (`/agents/accounts`).
- **Admins editing an agent** still use `PUT /admin/agents/{id}` (see `fe-handoff-admin-profile-update.md` for how that route works).

## 5. Checklist

- [ ] Save the agent's profile with `PUT /api/v1/agents/me`. Remove any call to `/agents/update-profile`.
- [ ] Send only the changed fields: `first_name`, `last_name`, `phone`, `designation`.
- [ ] Show the email as read-only, and do not send it.
- [ ] Send `null` to clear `phone` or `designation`. Do not send `null` for the names.
- [ ] Validate lengths and the phone pattern in the form, and show 422 `errors.*` next to each field.
- [ ] Refresh the page's agent object from `data`.
- [ ] Show your own success text, or use the message "Profile updated successfully".
- [ ] Handle 401, 403 and 500 by status code.
- [ ] Test on staging once the backend confirms it is deployed.

## 6. Questions for the backend

- Does an agent need to change their own email? It would need a verification step, so it is not allowed today.
- Does the portal need other profile fields (for example job description or address)?
- Which environment has this endpoint?
