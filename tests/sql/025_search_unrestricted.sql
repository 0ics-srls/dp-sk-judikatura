-- an unrestricted search (no query, no filter) lists rows: a Screen opens with it (P79-56); the Tool itself is exercised by the C# tests, here the table answers
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 't025', 'NSSR', '1Cdo/1/2025', 'text', 'api');

SELECT (SELECT count(*) FROM (SELECT * FROM rozhodnutia ORDER BY datum_rozhodnutia DESC NULLS LAST, id LIMIT 10) x) = 1 AS ok
