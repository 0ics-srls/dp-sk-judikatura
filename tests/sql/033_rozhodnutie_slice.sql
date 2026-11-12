-- text slices: 45,000 characters = slices 0-20000, 20000-40000, 40000-45000; the last slice is not truncated
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 't033', 'NSSR', '1Cdo/1/2033', repeat('x', 45000), 'api');
SELECT (SELECT length(substr(text_raw, 1, 20000)) FROM rozhodnutia) = 20000
   AND (SELECT (0 + 20000 < length(text_raw)) FROM rozhodnutia)
   AND (SELECT length(substr(text_raw, 40000 + 1, 20000)) FROM rozhodnutia) = 5000
   AND NOT (SELECT (40000 + 20000 < length(text_raw)) FROM rozhodnutia)
   AND (SELECT length(text_raw) FROM rozhodnutia) = 45000 AS ok
