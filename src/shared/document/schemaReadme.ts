export const SCHEMA_KIT_README = `# BlazeAudit document JSON — instructions for AI conversion

You are helping migrate legacy fire-inspection paperwork into JSON that BlazeAudit can import.

## Output format

Return **one JSON object** that matches the BlazeAudit document model:

- \`schemaVersion\`: must be \`1\`
- \`meta\`: fixed header
  - \`title\` (string, required)
  - \`clientId\` (null for templates)
  - \`inspectionType\` (string)
  - \`inspectionDate\` (null for templates, or \`YYYY-MM-DD\` for inspections)
- \`blocks\`: ordered array of typed blocks

## Block types

| type | purpose |
|------|---------|
| heading | section title (\`config.level\` 1–3, \`config.text\`) |
| paragraph | static text (\`config.text\`) |
| textField | fill-in field (\`config.multiline\`, \`config.placeholder\`) |
| lines | ruled write-on lines (\`config.count\`) |
| checklist | pass/fail items (\`config.items[]\` with \`id\`, \`label\`) |
| table | data grid (\`config.columns[]\` with \`key\`, \`title\`, \`width\`; \`value.rows[]\`, \`value.rowHeights[]\`; \`config.layoutLocked\`) |
| signature | sign-off block |
| section | container with \`children[]\`; \`config.collapsible\`, \`config.optional\` |
| spacer | vertical space (\`config.size\`: sm/md/lg) |
| image | embedded photo (\`value.dataUrl\` when filled) |

Every block needs a unique \`id\` (UUID), \`type\`, \`config\`, and \`value\` (null in templates).

## Rules

1. Prefer \`table\` for equipment grids — define columns first, then rows.
2. Use \`checklist\` for pass/fail line items, not free text.
3. Use \`lines\` for open-ended handwritten areas on the printed form.
4. Group related blocks under \`section\` when the source form has collapsible parts.
5. Do **not** wrap the document in extra keys unless exporting from BlazeAudit itself
   (\`kind: "blazeaudit-template"\` envelope is also accepted on import).

## Validation

The attached \`schema.json\` describes the expected shape. The \`example.json\` shows a
real filled document. Match both as closely as possible.

Return **only** the JSON object — no markdown fences, no commentary.
`;
