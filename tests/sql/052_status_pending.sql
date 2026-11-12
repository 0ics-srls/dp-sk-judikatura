-- status pending: passages without an embedding are counted
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, text_raw, text_source) VALUES ('00000000-0000-0000-0000-000000000052', 'nsud', 't052', 'NSSR', 'x', 'x', 'api');
INSERT INTO passages (rozhodnutie_id, seq, text, text_contextual, embedding) VALUES
 ('00000000-0000-0000-0000-000000000052', 0, 'a', 'a', array_fill(0::real, ARRAY[1024])::vector),
 ('00000000-0000-0000-0000-000000000052', 1, 'b', 'b', NULL),
 ('00000000-0000-0000-0000-000000000052', 2, 'c', 'c', NULL);
SELECT (SELECT count(*) FROM passages WHERE embedding IS NULL) = 2 AND (SELECT count(*) FROM passages) = 3 AS ok
