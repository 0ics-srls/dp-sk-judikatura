DELETE FROM passages;
DELETE FROM rozhodnutia;

INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, text_raw, text_source)
VALUES ('00000000-0000-0000-0000-000000000001', 'nsud', 'p1', 'NSSR', 'x', 'text', 'api');
INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 'a', '[NSSR x] a'), ('00000000-0000-0000-0000-000000000001', 1, 'b', '[NSSR x] b');

-- (rozhodnutie_id, seq) is unique
DO $$
BEGIN
    INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual) VALUES ('00000000-0000-0000-0000-000000000001', 1, 'c', 'c');
    RAISE EXCEPTION 'duplicate (rozhodnutie_id, seq) was accepted';
EXCEPTION WHEN unique_violation THEN
    NULL;
END $$;

-- the embedding column is vector(1024), nullable, with an HNSW cosine index
SELECT (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a WHERE a.attrelid = 'passages'::regclass AND a.attname = 'embedding') = 'vector(1024)'
   AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'passages' AND indexdef ILIKE '%USING hnsw%vector_cosine_ops%')
   AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'passages' AND indexdef ILIKE '%(rozhodnutie_id)%')
   AND (SELECT count(*) FROM passages WHERE embedding IS NULL) = 2 AS ok
