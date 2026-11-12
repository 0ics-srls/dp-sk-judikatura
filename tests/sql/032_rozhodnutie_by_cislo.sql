-- the same case number can repeat (other source id): a lookup by cislo returns both, newest decision date first
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, datum_rozhodnutia, text_raw, text_source) VALUES
 ('nsud', 't032a', 'NSSR', '8Cdo/21/2014', DATE '2014-05-01', 'a', 'api'),
 ('nsud', 't032b', 'NSSR', '8Cdo/21/2014', DATE '2015-02-01', 'b', 'api');
SELECT (SELECT string_agg(text_raw, ',' ORDER BY datum_rozhodnutia DESC NULLS LAST, id) FROM rozhodnutia WHERE cislo = '8Cdo/21/2014') = 'b,a' AS ok
