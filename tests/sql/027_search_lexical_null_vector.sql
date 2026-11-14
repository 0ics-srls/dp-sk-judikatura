-- search mode lexical: the Host skips the query embedding (x-embed.skipWhen) and binds q_vec NULL; the lexical rows are exactly those of a call that had a vector
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES
 ('nsud', 't027a', 'NSSR', '1Cdo/1/2027', 'Nahrada skody bola priznana navrhovatelovi.', 'api'),
 ('nsud', 't027b', 'NSSR', '2Cdo/2/2027', 'Nahrada skody a urok z omeskania.', 'api'),
 ('nsud', 't027c', 'NSSR', '3Cdo/3/2027', 'Dovolanie bolo zamietnute.', 'api');
INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual, embedding)
SELECT id, 0, 'p', 'p', array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector FROM rozhodnutia WHERE source_id IN ('t027a', 't027b');

WITH calls AS (
    SELECT 'with_vector' AS name, 'lexical' AS mode, CAST(array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector AS text) AS q_vec
    UNION ALL
    SELECT 'null_vector', 'lexical', CAST(NULL AS text)
),
result AS (
    SELECT c.name,
           (SELECT array_agg(f.source_id ORDER BY f.rn)
              FROM (SELECT d.source_id, row_number() OVER (ORDER BY ts_rank_cd(d.search_vector_sk, websearch_to_tsquery('sk_unaccent'::regconfig, 'nahrada skody')) DESC, d.id) AS rn
                      FROM rozhodnutia d
                     WHERE c.mode <> 'semantic' AND d.search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'nahrada skody')) f) AS lexical_rows,
           (SELECT count(*) FROM passages ps
             WHERE c.mode <> 'lexical' AND CAST(c.q_vec AS vector) IS NOT NULL AND ps.embedding IS NOT NULL) AS semantic_rows
      FROM calls c
)
SELECT (SELECT count(*) FROM result) = 2
   AND (SELECT count(DISTINCT lexical_rows) FROM result) = 1
   AND (SELECT lexical_rows FROM result WHERE name = 'null_vector') @> ARRAY['t027a', 't027b']
   AND (SELECT cardinality(lexical_rows) FROM result WHERE name = 'null_vector') = 2
   AND (SELECT max(semantic_rows) FROM result) = 0 AS ok
