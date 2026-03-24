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

type CreateFontRequest = {
  id?: number | string;
  name?: string;
  slug?: string;
  font_json?: JsonValue | null;
  tags_json?: JsonValue | null;
  pairings_json?: JsonValue | null;
  pair_font_ids_json?: JsonValue | null;
  updated_at?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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

const toJsonText = (value: JsonValue | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
};

const mapRowToFont = (row: RawFontMergedRow): FontMerged => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  font_json: parseJsonField(row.font_json),
  tags_json: parseJsonField(row.tags_json),
  pairings_json: parseJsonField(row.pairings_json),
  pair_font_ids_json: parseJsonField(row.pair_font_ids_json),
  updated_at: row.updated_at,
});

app.get('/api/fonts', async (c) => {
  const sql = `
    SELECT id, name, slug, font_json, tags_json, pairings_json, pair_font_ids_json, updated_at
    FROM fonts_merged
    ORDER BY name ASC
  `;

  const { results = [] } = await c.env.DB.prepare(sql).all<RawFontMergedRow>();

  const fonts: FontMerged[] = results.map(mapRowToFont);

  return c.json({
    count: fonts.length,
    fonts,
  });
});

app.post('/api/fonts', async (c) => {
  let body: CreateFontRequest;

  try {
    body = (await c.req.json()) as CreateFontRequest;
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const name = body.name?.trim();
  const slug = body.slug?.trim();

  if (!name || !slug) {
    return c.json({ error: 'name and slug are required' }, 400);
  }

  const updatedAt = body.updated_at ?? new Date().toISOString();
  const hasExplicitId =
    body.id !== undefined && body.id !== null && String(body.id).trim() !== '';

  const insertSql = hasExplicitId
    ? `
      INSERT INTO fonts_merged
      (id, name, slug, font_json, tags_json, pairings_json, pair_font_ids_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    : `
      INSERT INTO fonts_merged
      (name, slug, font_json, tags_json, pairings_json, pair_font_ids_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  const bindValues = hasExplicitId
    ? [
        body.id,
        name,
        slug,
        toJsonText(body.font_json),
        toJsonText(body.tags_json),
        toJsonText(body.pairings_json),
        toJsonText(body.pair_font_ids_json),
        updatedAt,
      ]
    : [
        name,
        slug,
        toJsonText(body.font_json),
        toJsonText(body.tags_json),
        toJsonText(body.pairings_json),
        toJsonText(body.pair_font_ids_json),
        updatedAt,
      ];

  const insertResult = await c.env.DB.prepare(insertSql).bind(...bindValues).run();
  const createdId = hasExplicitId ? body.id : insertResult.meta.last_row_id;

  const createdRow = await c.env.DB
    .prepare(
      `
      SELECT id, name, slug, font_json, tags_json, pairings_json, pair_font_ids_json, updated_at
      FROM fonts_merged
      WHERE id = ?
      LIMIT 1
      `,
    )
    .bind(createdId)
    .first<RawFontMergedRow>();

  if (!createdRow) {
    return c.json({ created: true, id: createdId }, 201);
  }

  return c.json({ created: true, font: mapRowToFont(createdRow) }, 201);
});

app.delete('/api/fonts/:id', async (c) => {
  const id = c.req.param('id')?.trim();

  if (!id) {
    return c.json({ error: 'id is required' }, 400);
  }

  const deleteResult = await c.env.DB
    .prepare('DELETE FROM fonts_merged WHERE id = ?')
    .bind(id)
    .run();

  const changes = deleteResult.meta.changes ?? 0;

  if (changes === 0) {
    return c.json({ error: 'Font not found' }, 404);
  }

  return c.json({ deleted: true, id, changes });
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
