-- status: live coverage per court and the honest limits, all from the data. An empty corpus answers one row of zeros (court NULL).
-- skipped (by reason) and coverage (the last 24 windows) are corpus-wide and repeated on each court row: skipped items carry no court.
WITH docs AS (
    SELECT d.id, d.court, d.kolegium, d.text_source, d.pii_flags, d.ingested_at,
           extract(year FROM d.datum_rozhodnutia)::int AS yr,
           (SELECT count(*) FROM passages p WHERE p.rozhodnutie_id = d.id) AS n_pass,
           (SELECT count(*) FROM passages p WHERE p.rozhodnutie_id = d.id AND p.embedding IS NULL) AS n_pending
      FROM rozhodnutia d),
per AS (
    SELECT court,
           count(*) AS decisions,
           min(yr) AS year_min,
           max(yr) AS year_max,
           sum(pii_flags)::bigint AS pii_flags_total,
           sum(n_pass)::bigint AS passages_total,
           sum(n_pending)::bigint AS passages_pending,
           max(ingested_at) AS last_ingested_at
      FROM docs
     GROUP BY court),
src AS (
    SELECT court, jsonb_object_agg(text_source, n) AS by_source FROM (SELECT court, text_source, count(*) AS n FROM docs GROUP BY court, text_source) s GROUP BY court),
kol AS (
    SELECT court, jsonb_object_agg(kolegium, n) AS by_kolegium FROM (SELECT court, kolegium, count(*) AS n FROM docs WHERE kolegium IS NOT NULL GROUP BY court, kolegium) s GROUP BY court),
yrs AS (
    SELECT court, jsonb_object_agg(yr, n) AS by_year FROM (SELECT court, yr, count(*) AS n FROM docs WHERE yr IS NOT NULL GROUP BY court, yr) s GROUP BY court),
skp AS (
    SELECT COALESCE(jsonb_object_agg(reason, n), '{}'::jsonb) AS by_reason FROM (SELECT reason, count(*) AS n FROM skipped GROUP BY reason) s),
cov AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('window_from', window_from, 'window_to', window_to, 'ids_listed', ids_listed, 'ids_taken', ids_taken, 'pdf_only', pdf_only)
                              ORDER BY window_from), '[]'::jsonb) AS windows
      FROM (SELECT * FROM coverage ORDER BY window_from DESC LIMIT 24) c),
note AS (
    SELECT 'Iba Najvyssi sud SR (NS SR) z OpenData nsud.sk od roku 2005, nie sudy nizsich stupnov ani Ustavny sud SR. Fulltext simple: bez stemmingu a bez zhody diakritiky. '
           || 'Text rozhodnuti pred rokom 2014 pochadza z prilohy PDF (text_source pdf alebo ocr). Passages bez embeddingu nie su dosiahnutelne semantickym hladanim. '
           || 'pii_flags_total pocita retazce tvaru rodne cislo, IBAN, e-mail a telefon; rozhodnutia anonymizuje sud.' AS text)
SELECT per.court,
       per.decisions,
       per.year_min,
       per.year_max,
       COALESCE(src.by_source, '{}'::jsonb) AS text_sources,
       COALESCE(kol.by_kolegium, '{}'::jsonb) AS by_kolegium,
       COALESCE(yrs.by_year, '{}'::jsonb) AS by_year,
       per.pii_flags_total,
       per.passages_total,
       per.passages_pending,
       (SELECT by_reason FROM skp) AS skipped,
       (SELECT windows FROM cov) AS coverage,
       per.last_ingested_at,
       (SELECT text FROM note) AS honest_limits
  FROM per
  LEFT JOIN src ON src.court = per.court
  LEFT JOIN kol ON kol.court = per.court
  LEFT JOIN yrs ON yrs.court = per.court
UNION ALL
SELECT NULL, 0::bigint, NULL::int, NULL::int, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, 0::bigint, 0::bigint, 0::bigint,
       (SELECT by_reason FROM skp), (SELECT windows FROM cov), NULL::timestamptz, (SELECT text FROM note)
 WHERE NOT EXISTS (SELECT 1 FROM rozhodnutia)
 ORDER BY 1
