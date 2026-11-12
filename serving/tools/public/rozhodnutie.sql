-- rozhodnutie: one decision by id, ecli or cislo, the text in slices (the legacy get_rozhodnutie view as columns, plus truncated / text_length / next_offset).
-- Exactly one key is required by the parameter schema (oneOf), so at most one of the three predicates is active. ecli is not unique and a case number can repeat:
-- up to 5 rows, newest decision date first (a missing date last), id breaks ties.
WITH prm AS (SELECT CAST(@offset AS int) AS o, CAST(@length AS int) AS l)
SELECT d.id,
       d.fonte,
       d.source_id,
       d.court,
       d.cislo,
       d.senat,
       d.ecli,
       d.datum_rozhodnutia,
       d.kolegium,
       d.kolegium_nazov,
       d.merito,
       d.sudca,
       substr(d.text_raw, prm.o + 1, prm.l) AS text,
       length(d.text_raw) AS text_length,
       (prm.o + prm.l < length(d.text_raw)) AS truncated,
       CASE WHEN prm.o + prm.l < length(d.text_raw) THEN prm.o + prm.l END AS next_offset,
       d.text_source,
       d.pdf_url,
       d.source_url,
       d.pii_flags
  FROM rozhodnutia d
 CROSS JOIN prm
 WHERE (@id IS NOT NULL AND d.id = CAST(@id AS uuid))
    OR (@id IS NULL AND @ecli IS NOT NULL AND d.ecli = @ecli)
    OR (@id IS NULL AND @ecli IS NULL AND d.cislo = @cislo)
 ORDER BY d.datum_rozhodnutia DESC NULLS LAST, d.id
 LIMIT 5
