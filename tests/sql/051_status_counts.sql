-- status counts per court: 6 decisions, 2 courts, 2 PDF-sourced, one with pii_flags 2
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, datum_rozhodnutia, kolegium, text_raw, text_source, pii_flags) VALUES
 ('nsud', 't051a', 'NSSR',  'a', DATE '2014-01-01', '1', 'a', 'api', 0),
 ('nsud', 't051b', 'NSSR',  'b', DATE '2015-01-01', '1', 'b', 'api', 2),
 ('nsud', 't051c', 'NSSR',  'c', DATE '2011-01-01', '3', 'c', 'pdf', 0),
 ('nsud', 't051d', 'NSSR',  'd', DATE '2012-01-01', '3', 'd', 'pdf', 0),
 ('nsud', 't051e', 'NSSSR', 'e', DATE '2022-01-01', '3', 'e', 'api', 0),
 ('nsud', 't051f', 'NSSSR', 'f', DATE '2023-01-01', '3', 'f', 'api', 0);
SELECT (SELECT count(*) FROM rozhodnutia WHERE court = 'NSSR') = 4
   AND (SELECT count(*) FROM rozhodnutia WHERE court = 'NSSSR') = 2
   AND (SELECT count(*) FROM rozhodnutia WHERE text_source = 'pdf') = 2
   AND (SELECT sum(pii_flags) FROM rozhodnutia) = 2 AS ok
