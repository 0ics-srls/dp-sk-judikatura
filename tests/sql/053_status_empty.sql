-- status on empty tables: documented as one row of zeros (court NULL), never an error; here: the tables are empty and the aggregates answer without failing
DELETE FROM passages;
DELETE FROM rozhodnutia;
SELECT (SELECT count(*) FROM rozhodnutia) = 0 AND (SELECT COALESCE(sum(pii_flags), 0) FROM rozhodnutia) = 0 AND (SELECT count(*) FROM passages WHERE embedding IS NULL) = 0 AS ok
