-- search, filters on the decision: court exact, kolegium code, decision date with both bounds and with one bound
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, datum_rozhodnutia, kolegium, text_raw, text_source) VALUES
 ('nsud', 't021a', 'NSSR',  '1Cdo/1/2020', DATE '2020-01-10', '1', 'text a', 'api'),
 ('nsud', 't021b', 'NSSR',  '3Sžo/2/2021', DATE '2021-06-15', '3', 'text b', 'api'),
 ('nsud', 't021c', 'NSSSR', '1Szk/3/2022', DATE '2022-03-20', '3', 'text c', 'api'),
 ('nsud', 't021d', 'NSSR',  '4Tdo/4/2023', NULL,              '4', 'text d', 'pdf');

SELECT (SELECT count(*) FROM rozhodnutia WHERE court = 'NSSSR') = 1
   AND (SELECT count(*) FROM rozhodnutia WHERE court = 'NSSR') = 3
   AND (SELECT count(*) FROM rozhodnutia WHERE kolegium = '3') = 2
   AND (SELECT count(*) FROM rozhodnutia WHERE datum_rozhodnutia >= DATE '2021-01-01' AND datum_rozhodnutia <= DATE '2021-12-31') = 1
   AND (SELECT count(*) FROM rozhodnutia WHERE datum_rozhodnutia >= DATE '2021-01-01') = 2
   AND (SELECT count(*) FROM rozhodnutia WHERE datum_rozhodnutia <= DATE '2020-12-31') = 1 AS ok
