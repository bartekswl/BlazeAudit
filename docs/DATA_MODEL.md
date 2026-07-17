# BlazeAudit — Data Model

> **BlazeAudit** is a product by **SubraLab**.

| | |
| --- | --- |
| **Status** | Living draft — provisional, expect change |
| **Last updated** | 2026-06-05 |

> ⚠️ **Nothing here is final.** This is an early exploration of how data *might*
> be shaped, written to give development a starting point. The schema, block
> types, and field names will be designed and refined iteratively as we build —
> do not commit to this as the one true model. Treat it as a sketch to react to,
> not a specification.

This document sketches two related ideas:

1. A possible **relational schema** (SQLite) for persistence.
2. A possible **document/block model** (JSON) for templates, inspections, the
   editor, and PDF export.

## 1. Relational schema (SQLite)

> The database is **encrypted at rest with SQLCipher**; it is opened with the
> per-account key ("key X"). See [`SECURITY.md`](SECURITY.md) for key management.

### `clients`

| Column        | Type      | Notes                              |
| ------------- | --------- | ---------------------------------- |
| `id`          | TEXT (PK) | UUID                               |
| `name`        | TEXT      | Client / site name (required)      |
| `address`     | TEXT      | Site address                       |
| `contact_name`| TEXT      | Primary contact                    |
| `phone`       | TEXT      |                                    |
| `email`       | TEXT      |                                    |
| `notes`       | TEXT      | Free-form notes                    |
| `created_at`  | TEXT      | ISO 8601 timestamp                 |
| `updated_at`  | TEXT      | ISO 8601 timestamp                 |

### `templates`

| Column       | Type      | Notes                                          |
| ------------ | --------- | ---------------------------------------------- |
| `id`         | TEXT (PK) | UUID                                           |
| `name`       | TEXT      | Template name (required)                       |
| `description`| TEXT      |                                                |
| `document`   | TEXT      | JSON-encoded block tree (see §2)               |
| `version`    | INTEGER   | Incremented on edit                            |
| `created_at` | TEXT      | ISO 8601                                       |
| `updated_at` | TEXT      | ISO 8601                                       |

### `inspections`

| Column         | Type      | Notes                                                |
| -------------- | --------- | ---------------------------------------------------- |
| `id`           | TEXT (PK) | UUID                                                 |
| `client_id`    | TEXT (FK) | → `clients.id`                                       |
| `template_id`  | TEXT (FK) | → `templates.id` (origin template; nullable)         |
| `title`        | TEXT      | e.g. "Annual sprinkler inspection — 2026"            |
| `status`       | TEXT      | `draft` \| `complete`                                |
| `inspector`    | TEXT      | Inspector name                                       |
| `document`     | TEXT      | JSON-encoded block tree + values (snapshot, see §2)  |
| `inspected_at` | TEXT      | Inspection date (ISO 8601)                           |
| `cadence`      | TEXT      | Re-inspection interval, e.g. `monthly` \| `quarterly` \| `annual` \| `P6M` (ISO 8601 duration for custom) |
| `next_due_at`  | TEXT      | Derived next-due date = `inspected_at` + `cadence` (ISO 8601) |
| `created_at`   | TEXT      | ISO 8601                                             |
| `updated_at`   | TEXT      | ISO 8601                                             |

**Key decision:** each inspection stores its **own snapshot** of the document
tree. Editing a template later does not alter past inspections.

`next_due_at` powers the due/overdue **reminders dashboard** (see
[`TEMPLATES.md`](TEMPLATES.md) §4); it is derived, recomputed when `inspected_at`
or `cadence` changes.

### `app_meta`

| Column   | Type | Notes                              |
| -------- | ---- | ---------------------------------- |
| `key`    | TEXT | e.g. `schema_version`              |
| `value`  | TEXT |                                    |

Used for schema/migration bookkeeping.

### Local activation / account state

Per-install licensing and login state. Secrets (key X, token) are **not** stored
in plaintext here — they live in OS-protected storage (Windows DPAPI via
`safeStorage`); this table holds the non-secret bookkeeping. (Exact split between
`app_meta` and a dedicated table is an implementation detail.)

| Field            | Notes                                                            |
| ---------------- | ---------------------------------------------------------------- |
| `account_email`  | Identity label this install is activated under                   |
| `instance_id`    | UUID + machine fingerprint registered with the server            |
| `activation_token` | Signed token from the server (verified offline)                |
| `key_x_wrapped`  | Key X wrapped by the password-derived KEK (Argon2id)             |
| `password_hash`  | Argon2id hash for the local login                                |
| `last_check_in`  | Timestamp of the last successful monthly validity check          |
| `license_state`  | `active` \| `revoked` (revoked is persisted, survives restarts)  |

> Key X itself and the raw token are additionally protected by DPAPI; nothing in
> human-readable form. Email is an identity label only, never a decryption factor.

## 2. Document / block model (JSON)

A document is a tree of typed **blocks**. The same structure is used by templates
(defaults) and inspections (defaults + values).

### Document shape

```jsonc
{
  "schemaVersion": 1,
  "meta": {
    // Fixed document header (always rendered on top):
    "title": "Sprinkler System Inspection",
    "clientId": "uuid-or-null",     // relation to clients.id (address auto-fills)
    "inspectionType": "Annual sprinkler",
    "inspectionDate": "2026-06-06", // mirrors inspections.inspected_at
    "branding": { "company": "SubraLab" }
  },
  "blocks": [ /* Block[] */ ]
}
```

> The **header** (`meta.title`, `meta.clientId`, `meta.inspectionType`,
> `meta.inspectionDate`) is fixed and always present; the **body** (`blocks`) is
> the customizable tree. See [`TEMPLATES.md`](TEMPLATES.md) §1.

### Base block

Every block shares a common shape:

```jsonc
{
  "id": "uuid",
  "type": "heading | paragraph | textField | lines | checklist | table | signature | section | spacer | image",
  "label": "Optional human label",
  "config": { /* type-specific options */ },
  "value": null,        // filled in inspections; null/empty in templates
  "children": []         // present for container blocks (e.g. "section")
}
```

### Block types (initial set)

| Type             | Purpose                                         | Notable `config` / `value`                              |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `heading`        | Section/title text                              | `config.level` (1–3); `config.text`                     |
| `paragraph`      | Static or rich descriptive text                 | `config.text`                                           |
| `textField`      | Single/multi-line input                         | `config.multiline`, `config.placeholder`; `value: string` |
| `lines`          | Empty ruled lines to write on (printed PDF)     | `config.count` (add/remove lines)                       |
| `checklist`      | List of pass/fail/NA line items                 | `config.items[]` (add/remove lines); `value` per item   |
| `table`          | Generic data table (generalizes equipment grids)| `config.columns[]` (add/remove **columns**); `value.rows[]` (add/remove **rows**) |
| `signature`      | Signature + name/date                           | `value: { name, dataUrl, date }`                        |
| `section`        | Container that groups child blocks; toggleable  | `config.collapsible`, `config.optional`; `children[]`   |
| `spacer`         | Visual spacing                                  | `config.size`                                           |
| `image`          | Embedded image (e.g. site photo)                | `value.dataUrl`                                          |

### Editor operations (map directly to tree mutations)

- **Add component** → insert a new block into `blocks`/`children`.
- **Remove component** → remove a block by `id`.
- **Reorder** → reorder within a parent's array.
- **Add table** → insert a `table` block.
- **Add/remove table row** → push/splice `table.value.rows`.
- **Add/remove table column** → push/splice `table.config.columns` (and the
  matching key on each row).
- **Add/remove checklist line** → push/splice `checklist.config.items`.
- **Set write-on lines** → adjust `lines.config.count`.
- **Toggle section** → flip `section.config.optional` / visibility.

### Example: table block

```jsonc
{
  "id": "blk_123",
  "type": "table",
  "label": "Extinguishers",
  "config": {
    "columns": [
      { "key": "location", "title": "Location" },
      { "key": "type", "title": "Type" },
      { "key": "size", "title": "Size" },
      { "key": "lastService", "title": "Last Service" },
      { "key": "status", "title": "Status" }
    ]
  },
  "value": {
    "rows": [
      { "location": "Lobby", "type": "ABC", "size": "5 lb", "lastService": "2025-12", "status": "OK" }
    ]
  }
}
```

## 3. Versioning & migrations

- `document.schemaVersion` lets the app migrate old document trees forward.
- `app_meta.schema_version` tracks the SQLite schema version for DB migrations.
- Both are bumped deliberately, with migration code added alongside.
- `document.schemaVersion` also governs **import/export**: imported JSON (from a
  file, an external AI's output, or an embedded-PDF round-trip) is validated
  against the published schema for its version and migrated forward as needed. See
  [`TEMPLATES.md`](TEMPLATES.md) §3 and
  [`adr/0003-document-model-portability.md`](adr/0003-document-model-portability.md).

## 4. Server-side data (sketch)

The separate license/admin server (co-hosted with the marketing site) holds
**account/licensing metadata only — never inspection data**. Provisional shape:

### `accounts`

| Column      | Notes                                  |
| ----------- | -------------------------------------- |
| `id`        | PK                                     |
| `email`     | Unique identity                        |
| `created_at`| ISO 8601                               |

### `license_keys`

| Column       | Notes                                          |
| ------------ | ---------------------------------------------- |
| `key`        | The activation key (single-use)                |
| `account_id` | → `accounts.id`                                |
| `state`      | `issued` \| `consumed` \| `revoked`            |
| `version`    | Program version this key authorizes            |

### `instances`

| Column        | Notes                                         |
| ------------- | --------------------------------------------- |
| `id`          | Instance id (UUID + fingerprint)              |
| `account_id`  | → `accounts.id` (one active per account)      |
| `state`       | `active` \| `revoked`                         |
| `last_seen`   | Last successful check-in                      |

### `escrowed_keys` (crown jewels)

| Column        | Notes                                                   |
| ------------- | ------------------------------------------------------- |
| `account_id`  | → `accounts.id`                                         |
| `key_x`       | The stable per-account key, **encrypted at rest**       |

### `telemetry`

| Column        | Notes                                                   |
| ------------- | ------------------------------------------------------- |
| `account_id`  | → `accounts.id`                                         |
| `username`    | Basic identity                                          |
| `app_version` | Reported at activation/check-in                         |
| `who_where`   | IP-derived location captured at activation              |
| `at`          | Timestamp                                               |

> This is a sketch; the actual store depends on the (still open) hosting choice
> and may be provided by a managed service. See [`SECURITY.md`](SECURITY.md) §10.

## 5. Backup file shape

A backup is a **single, self-contained encrypted file**:

- **Body:** the SQLCipher database (or an exported snapshot) encrypted with key X.
  Phase 7 moves **account preferences** (login policy, color theme, and later
  prefs) into the DB so they restore with clients, inspections, templates,
  business profile, and inspectors — one file, same experience on a new install.
- **Header (plaintext):** `{ accountEmail, schemaVersion, createdAt, appVersion }`
  — used only for friendly UX checks (e.g. "belongs to a different account"); it
  does **not** unlock the file. Only key X decrypts the body.

Restoration requires an install activated under the same email (which holds the
matching key X). See [`SECURITY.md`](SECURITY.md) §6–7.
