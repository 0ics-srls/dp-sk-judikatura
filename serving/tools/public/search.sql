-- HYBRID SEARCH PATTERN (sk-judikatura): lexical (simple FTS over merito + text_raw) fused by RRF with the semantic side (best passage per decision).
--   f      : the filtered decisions. court is an exact enum, kolegium a code, datum_from/datum_to bound the decision date.
--   lex    : ts_rank_cd on search_vector (id breaks ties), 2*k rows.
--   chunks/best/sem : nearest passage per decision (candidate pool max(200, 20*take)), parents filtered through the join, 2*k rows.
--   fused  : FULL OUTER JOIN on id, RRF k = 60, ties lexical first. Filter-only: the legacy order datum DESC (missing last), id.
--   snippet: best passage cut at 700 characters, else the first 200 characters of text_raw. headline: only for a lexical match, via ts_headline on the final rows.
--   guard  : datum_from > datum_to raises 22P02 (a Host 400); it sits in the outer WHERE as a one-time filter so it fires even when no row is read.
WITH prm AS (
    SELECT NULLIF(btrim(@query), '') AS query,
           LEAST(GREATEST(COALESCE(@k, 10), 1), 50)::int AS k,
           COALESCE(NULLIF(btrim(@mode), ''), 'hybrid') AS mode,
           CAST(@q_vec AS vector) AS qv
),
f AS (
    SELECT d.id, d.search_vector, d.datum_rozhodnutia
      FROM rozhodnutia d
     WHERE (@court IS NULL OR d.court = @court)
       AND (@kolegium IS NULL OR d.kolegium = CAST(@kolegium AS text))
       AND (@datum_from IS NULL OR d.datum_rozhodnutia >= CAST(@datum_from AS date))
       AND (@datum_to IS NULL OR d.datum_rozhodnutia <= CAST(@datum_to AS date))
),
tsq AS (
    SELECT CASE WHEN prm.query IS NOT NULL THEN websearch_to_tsquery('simple', prm.query) END AS q FROM prm
),
lex AS (
    SELECT r.id, r.rn
      FROM (
            SELECT f.id, row_number() OVER (ORDER BY ts_rank_cd(f.search_vector, tsq.q) DESC, f.id) AS rn
              FROM f, tsq, prm
             WHERE prm.query IS NOT NULL AND prm.mode <> 'semantic' AND f.search_vector @@ tsq.q
           ) r
     ORDER BY r.rn
     LIMIT (SELECT 2 * k FROM prm)
),
chunks AS (
    SELECT ps.rozhodnutie_id, ps.text, ps.embedding <=> prm.qv AS dist
      FROM passages ps
      JOIN f ON f.id = ps.rozhodnutie_id
     CROSS JOIN prm
     WHERE prm.query IS NOT NULL AND prm.mode <> 'lexical' AND prm.qv IS NOT NULL AND ps.embedding IS NOT NULL
     ORDER BY dist
     LIMIT (SELECT GREATEST(200, 20 * 2 * k) FROM prm)
),
best AS (
    SELECT DISTINCT ON (c.rozhodnutie_id) c.rozhodnutie_id, c.text, c.dist FROM chunks c ORDER BY c.rozhodnutie_id, c.dist
),
sem AS (
    SELECT r.id, r.chunk, r.rn
      FROM (SELECT b.rozhodnutie_id AS id, b.text AS chunk, row_number() OVER (ORDER BY b.dist, b.rozhodnutie_id) AS rn FROM best b) r
     ORDER BY r.rn
     LIMIT (SELECT 2 * k FROM prm)
),
fused AS (
    SELECT COALESCE(l.id, s.id) AS id, s.chunk,
           COALESCE(1.0 / (60 + l.rn), 0) + COALESCE(1.0 / (60 + s.rn), 0) AS rrf,
           COALESCE(l.rn, 1000000000) AS lex_rn,
           COALESCE(s.rn, 1000000000) AS sem_rn
      FROM lex l
      FULL OUTER JOIN sem s ON s.id = l.id
),
picked AS (
    (SELECT x.id, x.chunk, x.lex_rn, row_number() OVER (ORDER BY x.rrf DESC, x.lex_rn, x.sem_rn, x.id) AS pos
       FROM fused x
      ORDER BY pos
      LIMIT (SELECT k FROM prm))
    UNION ALL
    (SELECT f.id, NULL::text, 1000000000::bigint,
            row_number() OVER (ORDER BY f.datum_rozhodnutia DESC NULLS LAST, f.id)
       FROM f, prm
      WHERE prm.query IS NULL
      ORDER BY f.datum_rozhodnutia DESC NULLS LAST, f.id
      LIMIT (SELECT k FROM prm))
)
SELECT d.id,
       d.court,
       d.cislo,
       d.ecli,
       d.datum_rozhodnutia,
       d.kolegium_nazov,
       d.merito,
       h.headline,
       COALESCE(left(k.chunk, 700), left(d.text_raw, 200)) AS snippet,
       d.text_source,
       k.pos AS "position"
  FROM picked k
  JOIN rozhodnutia d ON d.id = k.id
 CROSS JOIN tsq
 CROSS JOIN LATERAL (
       SELECT CASE WHEN k.lex_rn < 1000000000
                   THEN left(ts_headline('simple', d.text_raw, tsq.q, 'StartSel=«,StopSel=»,MaxFragments=2,MaxWords=28,MinWords=8'), 1500)
              END AS headline
 ) h
 WHERE (CASE WHEN @datum_from > @datum_to THEN CAST('datum_from must not exceed datum_to: ' || @datum_from || ' > ' || @datum_to AS integer) END) IS NULL
 ORDER BY k.pos
