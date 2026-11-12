-- an ECLI is not unique: two decisions may carry the same one, a lookup by ecli returns both
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, ecli, text_raw, text_source) VALUES
 ('nsud', 't031a', 'NSSR', '1Cdo/1/2020', 'ECLI:SK:NSSR:2020:1.1', 'a', 'api'),
 ('nsud', 't031b', 'NSSR', '1Cdo/2/2020', 'ECLI:SK:NSSR:2020:1.1', 'b', 'api'),
 ('nsud', 't031c', 'NSSR', '1Cdo/3/2020', 'ECLI:SK:NSSR:2020:2.1', 'c', 'api');
SELECT (SELECT count(*) FROM rozhodnutia WHERE ecli = 'ECLI:SK:NSSR:2020:1.1') = 2 AND (SELECT count(*) FROM rozhodnutia WHERE ecli = 'ECLI:SK:NSSR:2020:2.1') = 1 AS ok
