# Fonts API Worker (Hono + D1)

Minimal Cloudflare Worker with one endpoint:

- `GET /api/fonts`

It reads from D1 table `fonts_merged`, orders by `name`, and returns:

```json
{
  "count": 123,
  "fonts": []
}
```

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

`wrangler.toml` already includes:

- `account_id`
- D1 binding `DB`
- D1 `database_id`
