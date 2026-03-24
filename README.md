# Fonts API Worker (Hono + D1)

Base URL: `https://api.funts.amans.place`

Backed by D1 table: `fonts_merged`

## Endpoints

### `GET /api/fonts`

Returns all fonts ordered by `name ASC`.

Response `200`:

```json
{
  "count": 123,
  "fonts": [
    {
      "id": 1,
      "name": "Inter",
      "slug": "inter",
      "font_json": {},
      "tags_json": [],
      "pairings_json": [],
      "pair_font_ids_json": [],
      "updated_at": "2026-03-24T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/fonts`

Creates a new font row in `fonts_merged`.

Request body:

```json
{
  "name": "Inter",
  "slug": "inter",
  "font_json": {},
  "tags_json": ["sans", "modern"],
  "pairings_json": [],
  "pair_font_ids_json": [2, 3]
}
```

Optional fields:
- `id` (number or string, only if you need explicit id)
- `updated_at` (ISO string; defaults to current timestamp)

Response `201`:

```json
{
  "created": true,
  "font": {
    "id": 1,
    "name": "Inter",
    "slug": "inter",
    "font_json": {},
    "tags_json": ["sans", "modern"],
    "pairings_json": [],
    "pair_font_ids_json": [2, 3],
    "updated_at": "2026-03-24T00:00:00.000Z"
  }
}
```

Validation error `400`:

```json
{
  "error": "name and slug are required"
}
```

### `DELETE /api/fonts/:id`

Deletes a font row by `id`.

Response `200`:

```json
{
  "deleted": true,
  "id": "1",
  "changes": 1
}
```

Not found `404`:

```json
{
  "error": "Font not found"
}
```

## FontMerged Type

`FontMerged` fields:
- `id`
- `name`
- `slug`
- `font_json` (parsed JSON)
- `tags_json` (parsed JSON)
- `pairings_json` (parsed JSON)
- `pair_font_ids_json` (parsed JSON)
- `updated_at`

## Errors and CORS

- Unhandled errors: `500` with `{ "error": "Internal Server Error" }`
- CORS: `Access-Control-Allow-Origin: *`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Authenticate Wrangler (if needed):

```bash
npx wrangler login
```

## Local Development

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```
