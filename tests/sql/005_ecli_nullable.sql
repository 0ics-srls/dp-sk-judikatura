DELETE FROM passages;
DELETE FROM rozhodnutia;

-- a 2011 PDF-only decision: no ECLI, no judge, no senat, no merito, no date columns beyond the decision date
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, datum_rozhodnutia, kolegium, kolegium_nazov, text_raw, text_source, pdf_url, source_url)
VALUES ('nsud', '90001', 'NSSR', '3Sžo/1/2011', DATE '2011-03-15', '3', 'Správne', 'Text z PDF prilohy', 'pdf', 'https://www.nsud.sk/data/att/x/1.pdf', 'https://www.nsud.sk/data/att/x/1.pdf');

SELECT count(*) = 1
   AND bool_and(ecli IS NULL AND sudca IS NULL AND senat IS NULL AND merito IS NULL)
   AND bool_and(pii_flags = 0)
   AND bool_and(ingested_at IS NOT NULL) AS ok
FROM rozhodnutia
