-- rozhodnutie by id: every column of the view is stored
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (id, fonte, source_id, court, cislo, senat, ecli, datum_rozhodnutia, kolegium, kolegium_nazov, merito, sudca, text_raw, text_source, source_url, pdf_url, pii_flags)
VALUES ('00000000-0000-0000-0000-000000000030', 'nsud', '150000', 'NSSR', '7Sžo/65/2016', '7', 'ECLI:SK:NSSR:2017:7015201167.1', DATE '2017-01-26', '3', 'Správne', 'katastrálne veci', 'JUDr. Zdenka Reisenauerová', 'Úplný text rozhodnutia.', 'api', 'https://example.test/1', 'https://example.test/1.pdf', 0);

SELECT (SELECT count(*) FROM rozhodnutia WHERE id = '00000000-0000-0000-0000-000000000030') = 1
   AND (SELECT bool_and(fonte = 'nsud' AND source_id = '150000' AND court = 'NSSR' AND senat = '7' AND kolegium = '3' AND kolegium_nazov = 'Správne' AND sudca IS NOT NULL AND source_url IS NOT NULL AND pdf_url IS NOT NULL) FROM rozhodnutia) AS ok
