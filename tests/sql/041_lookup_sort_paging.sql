-- lookup sort and paging: ties break by id, total is a window count constant over pages
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, datum_rozhodnutia, text_raw, text_source)
SELECT ('00000000-0000-0000-0000-0000000041' || lpad(g::text, 2, '0'))::uuid, 'nsud', 't041' || g, 'NSSR', 'c' || lpad(g::text, 2, '0'), DATE '2020-01-01' + (g % 3), 'x', 'api' FROM generate_series(1, 10) g;
WITH p AS (SELECT id, count(*) OVER () AS total FROM rozhodnutia ORDER BY datum_rozhodnutia DESC NULLS LAST, id LIMIT 4 OFFSET 4)
SELECT (SELECT count(*) FROM p) = 4 AND (SELECT min(total) FROM p) = 10 AND (SELECT max(total) FROM p) = 10 AS ok
