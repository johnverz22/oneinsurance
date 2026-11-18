# FE hand-off: admin profile photo

For: front-end developers on the admin portal (the profile page, the header avatar, the manage-admins list).

The agent portal needs **no change**.

**What changed:** admins and the superadmin can now have a profile photo. It works like the agent photo (`agent-profile-photo-fe.md`): the photo is stored on Google Drive, and the front end never gets a Drive link. It always reads the image through this API with the bearer token.

Status (2026-11-16):

| Change | PR | Status |
|---|---|---|
| Admin upload, view and remove a profile photo | [#55](https://github.com/nelszy/one-insurance/pull/55) | Open. Not on staging yet. Confirm with the backend before testing. |

No migration is needed.

---

## 1. Endpoints

All need an administrator's bearer token (admin or superadmin).

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/me/photo` | admin, superadmin | Upload or replace my photo |
| GET | `/api/v1/admin/me/photo` | admin, superadmin | The image itself (my photo) |
| DELETE | `/api/v1/admin/me/photo` | admin, superadmin | Remove my photo |
| GET | `/api/v1/admin/users/{id}/photo` | any administrator | The image itself (another administrator's photo) |

A **superadmin can have a photo too.** The superadmin account is blocked from `PUT /admin/users/{id}`, but this photo route is tied to the caller, so it is not affected.

## 2. Upload

```
POST /api/v1/admin/me/photo
Authorization: Bearer <admin token>
Content-Type: multipart/form-data
```

One field:

| Field | Required | Rules |
|---|---|---|
| `photo` | yes | JPG, PNG or WebP. Maximum 2 MB. SVG, GIF and PDF are rejected. |

Uploading again **replaces** the old photo. The old file is removed only after the new one is saved, so a failed upload keeps the current photo.

Success is `201`:

```json
{
  "success": true,
  "message": "Profile photo saved successfully",
  "data": {
    "id": 42,
    "mime_type": "image/png",
    "updated_at": "2026-11-16T06:00:00.000000Z",
    "url": "/api/v1/admin/me/photo?v=42"
  }
}
```

This is a hand-written sample. The field names and shape follow the backend.

### Errors

| Status | When | What to show |
|---|---|---|
| 401 | No or expired token. | Send the user to sign in. |
| 403 | The signed-in user is not an administrator. | The routes are admin only. |
| 422 | Wrong type, too large, or no file. `errors.photo` has the message. | Show it under the upload field. |
| 502 | Google Drive could not take the photo. The current photo is unchanged. | "Could not save your photo, please try again." |

The 422 messages are: "Please choose a photo to upload.", "The photo must be an image.", "The photo must be a JPG, PNG or WebP file." and "The photo must not exceed 2MB." Check the type and size in the browser first, so most users never see them.

## 3. Reading the photo

Every admin object now has `profile_photo`. It appears in:

- `GET /api/v1/admin/me`
- the `user` in the `POST /api/v1/admin/login` reply
- the replies of `POST /admin/users` (create), `PUT /admin/users/{id}` and `GET /admin/users/{id}`

**It is not in the list or the search.** `GET /admin/users` and `POST /admin/users/search` return the plain user rows, not this object. There is no `profile_photo` and no `url` on those rows. See section 5 for what to do in a list.

Its value is:

- `null` when the admin has no photo. Show your default avatar.
- Otherwise `{ id, mime_type, updated_at, url }`, as in the upload reply.

The **`url` depends on who is looking**:

| Whose photo | `url` |
|---|---|
| The signed-in administrator's own | `/api/v1/admin/me/photo?v=42` |
| Another administrator's | `/api/v1/admin/users/{id}/photo?v=42` |

**Use `url` exactly as given, query string included.** Do not build it yourself. The `?v=` part changes with every new upload, so use `url` as your cache key and fetch again when it changes.

### Showing the image

The image is behind the bearer token, so a plain `<img src>` or a link gets a `401`. Fetch it with the token, turn it into a blob and show that. This is the same as the agent photo:

```ts
const res = await authFetch(photo.url)        // sends the Bearer token
const objectUrl = URL.createObjectURL(await res.blob())
// <img src={objectUrl} />  -- call URL.revokeObjectURL(objectUrl) when done
```

- The response has `ETag` and `Cache-Control: private, max-age=3600`, so the browser reuses it. A repeat request with `If-None-Match` gets `304`.
- `GET` answers `404` when there is no photo. You do not need to call it when `profile_photo` is `null`.
- `GET /admin/users/{id}/photo` answers `404` when `{id}` is **not** an administrator. An agent's photo is read through the agent route (`/agents/{agentId}/profile-photo`), not this one.
- `GET /admin/users/{id}/photo` is for administrators only. An agent, merchant or integrator token gets `403`.

## 4. Removing

`DELETE /api/v1/admin/me/photo` answers `200`:

```json
{ "success": true, "message": "Profile photo removed successfully" }
```

`profile_photo` is `null` afterwards. It also answers `200` when there was no photo.

## 5. Things to know

- **A superadmin is not in the admin list.** `GET /admin/users` and the search only return regular admins, so the superadmin's photo comes from `GET /admin/me`. Another administrator viewing the superadmin's photo is not possible from the list, since the superadmin never appears there.
- **Photos in the manage-admins list.** The list rows have the raw `avatar_file_id`: `null` means no photo, any number means there is one. When there is one, read the image from `GET /api/v1/admin/users/{id}/photo` (the row's own `id`), with your token. That route does not need the `?v=`. To keep a stale picture from showing after a replacement, use `avatar_file_id` as your cache key, because it changes with every new upload. Check on staging that `avatar_file_id` is in the list rows, and tell the backend if it is not.
- **The photo shows in the update reply.** After `PUT /admin/users/{id}` the reply has `profile_photo` too, unchanged. Saving profile details does not touch the photo. It is a separate call.
- **Photos are not returned by the file routes.** The photo is also stored as a Drive file with the tag `profile_photo`. Do not use the `/admin/files/*` or `/agents/files/*` routes for it. Use the routes above.
- **The agent upload route does not accept admins.** `POST /agents/profile-photo` still answers `403` for an administrator. Use `/admin/me/photo`.
- **Size and type:** 2 MB, JPG, PNG or WebP, same as agents.

## 6. Checklist

- [ ] Profile page: an upload control (field name `photo`, JPG/PNG/WebP, 2 MB) that shows `errors.photo` on a 422.
- [ ] Show `profile_photo` from `GET /admin/me` and from the login `user`. Keep a default avatar for `null`.
- [ ] Fetch the image with the token and show it as a blob. Use `url` exactly as given and refetch when it changes. Revoke old blob URLs.
- [ ] A remove button that calls `DELETE /admin/me/photo`.
- [ ] After an upload or a remove, update the header avatar from the reply, not only the profile page.
- [ ] In the manage-admins list, use `avatar_file_id` (`null` = default avatar) and load `/admin/users/{id}/photo` with the token. The list has no `profile_photo` field.
- [ ] Handle 401 (sign in again), 403 (not an administrator) and 502 (try again).
- [ ] Do not call the agent photo routes for an administrator.
- [ ] Test on staging once #55 is there: upload as an admin, upload as the superadmin, replace, remove, and view another admin's photo from the list.

## 7. Questions for the backend

- Should a superadmin appear in the admin list, read-only, so their photo can be shown there?
- Should an administrator be able to remove another administrator's photo, for example one that is not appropriate? Today only the owner can.
- Should the list and the search return `profile_photo` like the other admin replies? Today they return plain rows.
- Do you need a smaller thumbnail for the header and list, instead of the full image?
