-- a PDF-only decision of 2011: text from the PDF, the PDF url is set, no ECLI
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, datum_rozhodnutia, text_raw, text_source, pdf_url) VALUES ('nsud', 't035', 'NSSR', '5Sžo/221/2010', DATE '2011-05-19', 'Text z PDF', 'pdf', 'https://www.nsud.sk/data/att/eec/363149.0d1260.pdf');
SELECT (SELECT bool_and(text_source = 'pdf' AND pdf_url IS NOT NULL AND ecli IS NULL) FROM rozhodnutia) AS ok
