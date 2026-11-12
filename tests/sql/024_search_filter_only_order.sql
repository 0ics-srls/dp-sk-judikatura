-- search without a query lists the newest decisions first (the legacy order datum DESC, id); a missing date comes last
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, datum_rozhodnutia, text_raw, text_source) VALUES
 ('00000000-0000-0000-0000-0000000024a1', 'nsud', 't024a', 'NSSR', 'a', DATE '2020-01-01', 'a', 'api'),
 ('00000000-0000-0000-0000-0000000024a2', 'nsud', 't024b', 'NSSR', 'b', DATE '2022-01-01', 'b', 'api'),
 ('00000000-0000-0000-0000-0000000024a3', 'nsud', 't024c', 'NSSR', 'c', NULL,              'c', 'api'),
 ('00000000-0000-0000-0000-0000000024a4', 'nsud', 't024d', 'NSSR', 'd', DATE '2022-01-01', 'd', 'api');

SELECT (SELECT string_agg(cislo, ',' ORDER BY datum_rozhodnutia DESC NULLS LAST, id) FROM rozhodnutia) = 'b,d,a,c'
   AND (SELECT string_agg(cislo, ',' ORDER BY datum_rozhodnutia DESC NULLS LAST, id) FROM (SELECT * FROM rozhodnutia ORDER BY datum_rozhodnutia DESC NULLS LAST, id LIMIT 2) x) = 'b,d' AS ok
