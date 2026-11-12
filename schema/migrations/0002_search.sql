-- dp-sk-judikatura 0002: full-text over merito and text, vector index, lookup indexes. Idempotent.
-- FTS configuration: simple (lower-case tokens, no stemming). PostgreSQL ships no Slovak configuration; D142 asks for sk_unaccent (simple + unaccent) but the
-- package role cannot create the unaccent extension ("permission denied to create extension unaccent": the Host creates only vector, see
-- DatasetProvisioner), so the recorded fallback of D142 applies: simple. Consequences: a query without diacritics does NOT match a word with diacritics and
-- inflected forms do not match; the semantic channel compensates and the guide Tool says so. The Tools and the ODCS ftsConfig use the same constant.
ALTER TABLE rozhodnutia ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(merito, '') || ' ' || text_raw)) STORED;

CREATE INDEX IF NOT EXISTS rozhodnutia_search_vector_idx ON rozhodnutia USING gin (search_vector);
CREATE INDEX IF NOT EXISTS rozhodnutia_datum_idx ON rozhodnutia (datum_rozhodnutia);
CREATE INDEX IF NOT EXISTS rozhodnutia_court_idx ON rozhodnutia (court);
CREATE INDEX IF NOT EXISTS rozhodnutia_ecli_idx ON rozhodnutia (ecli);
CREATE INDEX IF NOT EXISTS rozhodnutia_cislo_idx ON rozhodnutia (cislo);
CREATE INDEX IF NOT EXISTS rozhodnutia_kolegium_idx ON rozhodnutia (kolegium);
CREATE INDEX IF NOT EXISTS rozhodnutia_senat_idx ON rozhodnutia (senat);

CREATE INDEX IF NOT EXISTS passages_embedding_hnsw_idx ON passages USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS passages_rozhodnutie_id_idx ON passages (rozhodnutie_id);
