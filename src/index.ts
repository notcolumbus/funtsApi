import { Hono } from 'hono';
import { cors } from 'hono/cors';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type FontMerged = {
  id: number | string;
  name: string;
  slug: string;
  font_json: JsonValue | null;
  tags_json: JsonValue | null;
  pairings_json: JsonValue | null;
  pair_font_ids_json: JsonValue | null;
  updated_at: string;
};

type RawFontMergedRow = {
  id: number | string;
  name: string;
  slug: string;
  font_json: unknown;
  tags_json: unknown;
  pairings_json: unknown;
  pair_font_ids_json: unknown;
  updated_at: string;
};

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
  }),
);

const parseJsonField = (value: unknown): JsonValue | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return JSON.parse(value) as JsonValue;
  }

  return value as JsonValue;
};

app.get('/api/fonts', async (c) => {
  const sql = `
    SELECT id, name, slug, font_json, tags_json, pairings_json, pair_font_ids_json, updated_at
    FROM fonts_merged
    ORDER BY name ASC
  `;

  const { results = [] } = await c.env.DB.prepare(sql).all<RawFontMergedRow>();

  const fonts: FontMerged[] = results.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    font_json: parseJsonField(row.font_json),
    tags_json: parseJsonField(row.tags_json),
    pairings_json: parseJsonField(row.pairings_json),
    pair_font_ids_json: parseJsonField(row.pair_font_ids_json),
    updated_at: row.updated_at,
  }));

  return c.json({
    count: fonts.length,
    fonts,
  });
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
