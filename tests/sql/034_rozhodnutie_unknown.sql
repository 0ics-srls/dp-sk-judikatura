-- unknown decision: no row (the legacy 404)
DELETE FROM passages;
DELETE FROM rozhodnutia;
SELECT (SELECT count(*) FROM rozhodnutia WHERE id = '00000000-0000-0000-0000-000000000099') = 0 AS ok
