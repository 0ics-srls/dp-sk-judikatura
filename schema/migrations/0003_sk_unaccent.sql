-- dp-sk-judikatura 0003 (schema-agnostic: names resolve through the search_path of the migration role): full-text configuration sk_unaccent (D142): simple (lower-case tokens, no stemming) + the unaccent dictionary, so a query typed
-- without diacritics matches a word with diacritics and the other way round. PostgreSQL ships no Slovak configuration. The Host provides the unaccent
-- extension (allow-list of the dataset provisioner), the package role only uses the dictionary public.unaccent.
-- Additive and idempotent: the configuration is created once, the generated tsvector column and its index are rebuilt from the stored text (no data change).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config c JOIN pg_namespace n ON n.oid = c.cfgnamespace
                   WHERE c.cfgname = 'sk_unaccent' AND n.nspname = current_schema()) THEN
        CREATE TEXT SEARCH CONFIGURATION sk_unaccent (COPY = pg_catalog.simple);
        ALTER TEXT SEARCH CONFIGURATION sk_unaccent
            ALTER MAPPING FOR asciiword, word, hword, hword_asciipart, hword_part, asciihword
            WITH public.unaccent, pg_catalog.simple;
    END IF;
END
$$;

DROP INDEX IF EXISTS rozhodnutia_search_vector_idx;
ALTER TABLE rozhodnutia DROP COLUMN IF EXISTS search_vector;
ALTER TABLE rozhodnutia ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('sk_unaccent'::regconfig, coalesce(merito, '') || ' ' || text_raw)) STORED;
CREATE INDEX rozhodnutia_search_vector_idx ON rozhodnutia USING gin (search_vector);
