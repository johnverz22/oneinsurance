# FE hand-off: updating an admin profile

For: front-end developers on the admin portal's profile / account settings page.

This covers the error `"App\Http\Controllers\Api\v1\Admin\AgentUserResource" not found` when saving an admin profile, and how the update call works.

Status (2026-11-16):

| Change | PR | Status |
|---|---|---|
| Profile update answers with the admin resource; the crash and a leftover debug dump are removed | [#48](https://github.com/nelszy/one-insurance/pull/48) | Merged to `main`. Confirm with the backend that your environment has it. |
| A superadmin account cannot be updated or deleted here. Admin creation fixed. | [#54](https://github.com/nelszy/one-insurance/pull/54) | Open. See `fe-handoff-admin-creation.md`. |

Merged does not mean deployed. If you still see the `AgentUserResource` error, your environment does not have #48 yet.

---

## 1. The endpoint

There is **one** route for updating an admin, and it needs the admin's id in the path:

```
PUT /api/v1/admin/users/{id}
Authorization: Bearer <admin token>
Content-Type: application/json
```

- **There is no `PUT /admin/me` or `/admin/profile`.** Only `GET /admin/me` exists. Calling a different URL gives 404 or 405.
- **To update the signed-in admin**, read their id from `GET /api/v1/admin/me` (`data.id`), then call `PUT /api/v1/admin/users/{that id}`.
- **This works for an `admin` only.** A **superadmin** account cannot be updated here, see sections 4 and 5.

## 2. Request body

```json
{
  "first_name": "Ada",
  "last_name": "Min",
  "email": "ada@example.com",
  "phone": "+639171234567",
  "designation": "Ops Lead"
}
```

| Field | Type | Notes |
|---|---|---|
| `first_name` | string | Optional. |
| `last_name` | string | Optional. |
| `email` | string | Optional. See the warning below. |
| `phone` | string | Optional. |
| `designation` | string | Optional. For example "Ops Lead". |

- **Send only the fields that changed.** A field that is missing or `null` is left as it is.
- **You cannot clear a field.** Sending `null` or leaving it out keeps the old value. An empty string `""` is saved as empty. Ask the backend if the page needs a real "remove".
- **Other fields are ignored.** `role`, `status` and `password` are not changed by this call, even if sent. There is no password change here.

### What the backend does not check

The backend does not validate the values, so the form must:

- **`email`** is not checked as an email address, and **not checked for being unique.** Validate the format in the form. A duplicate is saved without an error today.
- **No length limits** on any field. Set sensible limits in the form.
- A 422 for these fields will not come back. Do not rely on `errors.email`.

## 3. Response

Success is `200`:

```json
{
  "success": true,
  "message": "Agent updated successfully",
  "data": {
    "id": 1,
    "name": "Ada Min",
    "email": "ada@example.com",
    "role": "admin",
    "phone": "+639171234567",
    "designation": "Ops Lead",
    "status": "active",
    "created_at": "2026-10-01T02:00:00.000000Z",
    "updated_at": "2026-11-13T02:00:00.000000Z",
    "settings": null
  }
}
```

This is a hand-written sample. The field names and shape follow the backend.

- **The message says "Agent updated successfully"** even for an admin. The text is kept the same so nothing breaks. Do not show it to the user as is. Show your own "Profile saved".
- **`name`** is the first and last name joined. There are no separate `first_name` and `last_name` in the response. Keep what the user typed, or read them again from the form.
- **`settings`** is `null` on this call. It is only filled when the settings are loaded, which this route does not do.
- Use `data` to refresh the displayed profile instead of calling `GET /admin/me` again.

## 4. Errors

| Status | Body message | When |
|---|---|---|
| 400 | "Failed to update agent" | No user has that id. |
| 401 | | No or expired token. |
| 403 | "Superadmin accounts cannot be updated here" | The `{id}` is a superadmin account. This applies to every caller, the superadmin itself included. Nothing is saved. |
| 500 | "Failed to update agent" | An unexpected error. The cause is in the server log. Show a retry message. |

The 400 and 500 messages are the same text. Tell them apart by the status code.

## 5. Who can call it

Today the route only requires a signed-in user. It does **not** check that the caller is an administrator, and it does **not** check that `{id}` is the caller's own id. Do not build the portal on that:

- **Show the profile form only to admins**, and only for the admin's own id unless you are building a "manage admins" screen.
- The backend plans to add a role check. The call from the admin portal for an admin's own profile will keep working when it does.
- **A superadmin account is the exception, and it is enforced today.** `PUT /admin/users/{id}` returns 403 when `{id}` is a superadmin. When `role` from `GET /admin/me` is `superadmin`, show the profile read-only and hide Save.
- `GET /admin/users/{id}` only finds regular admins. For a superadmin it answers `200` with "Admin user not found" and an empty `data`. Read the signed-in superadmin from `GET /admin/me`.

## 6. Adding another admin

Moved to its own hand-off: `fe-handoff-admin-creation.md`. In short: only a **superadmin** can call `POST /admin/users`, `phone` and `password_confirmation` are required, and the new admin can sign in straight away. This replaces what an earlier version of this section said about verification.

## 7. Checklist

- [ ] Call `PUT /admin/users/{id}` with the admin's id from `GET /admin/me`. There is no `/admin/me` update route.
- [ ] Send only changed fields: `first_name`, `last_name`, `email`, `phone`, `designation`.
- [ ] Validate the email format (and length limits) in the form. The backend will not.
- [ ] Show your own success text. Do not show "Agent updated successfully".
- [ ] Refresh the profile from `data`. Read `name`, not separate first and last names.
- [ ] Handle 400, 401 and 500 by status code.
- [ ] Show the profile screen to admins only. For a `superadmin`, show it read-only with no Save.
- [ ] Handle 403 on update: the target is a superadmin.
- [ ] If the `AgentUserResource` error still appears, tell the backend which environment. It means #48 is not deployed there.

## 8. Questions for the backend

- Which environment has #48?
- Should there be a `PUT /admin/me` that only updates the signed-in account (superadmin included), with email validation (format and unique)?
- Should the update route be limited to administrators and to the caller's own id?
