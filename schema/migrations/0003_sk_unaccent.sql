-- dp-sk-judikatura 0003: full-text configuration sk_unaccent (D142): simple (lower-case tokens, no stemming) + the unaccent dictionary, so a query typed
-- without diacritics matches a word with diacritics and the other way round. PostgreSQL ships no Slovak configuration. The Host provides the unaccent
-- extension (allow-list of the dataset provisioner); names resolve through the search_path of the migration role (dataset schema, public).
-- Additive only (the registry forbids DROP and DO): the new generated column search_vector_sk and its GIN index are built from the stored text, the old
-- search_vector (simple) and its index stay as unused legacy and are not read by any Tool. No data change.
CREATE TEXT SEARCH CONFIGURATION sk_unaccent (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION sk_unaccent
    ALTER MAPPING FOR asciiword, word, hword, hword_asciipart, hword_part, asciihword
    WITH unaccent, simple;

ALTER TABLE rozhodnutia ADD COLUMN IF NOT EXISTS search_vector_sk tsvector
    GENERATED ALWAYS AS (to_tsvector('sk_unaccent'::regconfig, coalesce(merito, '') || ' ' || text_raw)) STORED;
CREATE INDEX IF NOT EXISTS rozhodnutia_search_vector_sk_idx ON rozhodnutia USING gin (search_vector_sk);
