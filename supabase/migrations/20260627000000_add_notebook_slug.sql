-- Add slug column to notebooks for shareable playground URLs (/p/[slug])
ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS slug VARCHAR(64);

-- Unique index that ignores NULL (no slug set yet)
CREATE UNIQUE INDEX IF NOT EXISTS notebooks_slug_unique
  ON notebooks (slug)
  WHERE slug IS NOT NULL;
