-- search, semantic side: the best passage of a decision is its nearest one (cosine), cut at 700 characters; a decision appears once however many passages it has
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, text_raw, text_source) VALUES
 ('00000000-0000-0000-0000-0000000022a1', 'nsud', 't022a', 'NSSR', '1Cdo/1/2095', 'text rozhodnutia', 'api');
INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual, embedding) VALUES
 ('00000000-0000-0000-0000-0000000022a1', 0, 'lontano',  'lontano',  array_cat(array_fill(0::real, ARRAY[1023]), ARRAY[1::real])::vector),
 ('00000000-0000-0000-0000-0000000022a1', 1, repeat('v', 900), repeat('v', 900), array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector),
 ('00000000-0000-0000-0000-0000000022a1', 2, 'medio',    'medio',    array_cat(ARRAY[1::real, 1::real], array_fill(0::real, ARRAY[1022]))::vector);

WITH q AS (SELECT array_cat(ARRAY[1::real], array_fill(0::real, ARRAY[1023]))::vector AS qv),
     chunks AS (SELECT ps.rozhodnutie_id, ps.text, ps.embedding <=> q.qv AS dist FROM passages ps CROSS JOIN q WHERE ps.embedding IS NOT NULL ORDER BY dist LIMIT 200),
     best AS (SELECT DISTINCT ON (c.rozhodnutie_id) c.rozhodnutie_id, c.text, c.dist FROM chunks c ORDER BY c.rozhodnutie_id, c.dist)
SELECT (SELECT count(*) FROM best) = 1
   AND (SELECT length(left(b.text, 700)) FROM best b) = 700
   AND (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a WHERE a.attrelid = 'passages'::regclass AND a.attname = 'embedding') = 'vector(1024)' AS ok
