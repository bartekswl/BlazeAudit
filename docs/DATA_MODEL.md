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
| `created_at`   | TEXT      | ISO 8601                                             |
| `updated_at`   | TEXT      | ISO 8601                                             |

**Key decision:** each inspection stores its **own snapshot** of the document
tree. Editing a template later does not alter past inspections.

### `app_meta`

| Column   | Type | Notes                              |
| -------- | ---- | ---------------------------------- |
| `key`    | TEXT | e.g. `schema_version`              |
| `value`  | TEXT |                                    |

Used for schema/migration bookkeeping.

## 2. Document / block model (JSON)

A document is a tree of typed **blocks**. The same structure is used by templates
(defaults) and inspections (defaults + values).

### Document shape

```jsonc
{
  "schemaVersion": 1,
  "meta": {
    "title": "Sprinkler System Inspection",
    "branding": { "company": "SubraLab" }
  },
  "blocks": [ /* Block[] */ ]
}
```

### Base block

Every block shares a common shape:

```jsonc
{
  "id": "uuid",
  "type": "heading | paragraph | textField | checklist | equipmentTable | signature | section | spacer | image",
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
| `checklist`      | List of pass/fail/NA line items                 | `config.items[]` (add/remove lines); `value` per item   |
| `equipmentTable` | Tabular equipment data                          | `config.columns[]`; `value.rows[]` (add/remove rows)    |
| `signature`      | Signature + name/date                           | `value: { name, dataUrl, date }`                        |
| `section`        | Container that groups child blocks; toggleable  | `config.collapsible`, `config.optional`; `children[]`   |
| `spacer`         | Visual spacing                                  | `config.size`                                           |
| `image`          | Embedded image (e.g. site photo)                | `value.dataUrl`                                          |

### Editor operations (map directly to tree mutations)

- **Add component** → insert a new block into `blocks`/`children`.
- **Remove component** → remove a block by `id`.
- **Reorder** → reorder within a parent's array.
- **Add equipment table** → insert an `equipmentTable` block.
- **Add/remove row** → push/splice `equipmentTable.value.rows`.
- **Add/remove line** → push/splice `checklist.config.items`.
- **Toggle section** → flip `section.config.optional` / visibility.

### Example: equipment table block

```jsonc
{
  "id": "blk_123",
  "type": "equipmentTable",
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
