-- degraded mode: without a query vector the lexical list still answers (CAST of NULL to vector is NULL, the semantic list is empty)
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 't026', 'NSSR', '1Cdo/1/2026', 'dovolanie zalobcu', 'api');
INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual, embedding)
SELECT id, 0, 'dovolanie', 'dovolanie', array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector FROM rozhodnutia;

SELECT CAST(NULL AS vector) IS NULL
   AND (SELECT count(*) FROM passages ps WHERE ps.embedding <=> CAST(NULL AS vector) IS NOT NULL) = 0
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'dovolanie')) = 1 AS ok
