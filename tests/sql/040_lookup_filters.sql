-- lookup filters: each alone and combined (the legacy query_judikatura fields: court, cislo, senat, ecli, datum, kolegium)
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, senat, ecli, datum_rozhodnutia, kolegium, text_raw, text_source) VALUES
 ('nsud', 't040a', 'NSSR',  '8Cdo/21/2014', '8', 'ECLI:SK:NSSR:2014:1.1', DATE '2014-05-01', '1', 'a', 'api'),
 ('nsud', 't040b', 'NSSR',  '8Cdo/22/2015', '8', NULL,                    DATE '2015-02-01', '1', 'b', 'api'),
 ('nsud', 't040c', 'NSSSR', '1Szk/3/2022',  '1', 'ECLI:SK:NSSSR:2022:3.1', DATE '2022-03-20', '3', 'c', 'api');
SELECT (SELECT count(*) FROM rozhodnutia WHERE cislo ILIKE '8Cdo%') = 2
   AND (SELECT count(*) FROM rozhodnutia WHERE ecli = 'ECLI:SK:NSSR:2014:1.1') = 1
   AND (SELECT count(*) FROM rozhodnutia WHERE court = 'NSSSR') = 1
   AND (SELECT count(*) FROM rozhodnutia WHERE kolegium = '1' AND senat = '8' AND datum_rozhodnutia >= DATE '2015-01-01') = 1 AS ok
