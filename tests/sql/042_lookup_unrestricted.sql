-- an unrestricted lookup lists rows (a Screen opens with it)
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 't042', 'NSSR', '1Cdo/1/2042', 'x', 'api');
SELECT (SELECT count(*) FROM (SELECT * FROM rozhodnutia ORDER BY datum_rozhodnutia DESC NULLS LAST, id LIMIT 20) x) = 1 AS ok
