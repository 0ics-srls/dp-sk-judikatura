-- lookup (replaces the never exposed branch-53 query_judikatura): the extremes of the decisions that match the filters, never the text.
-- Fields of the legacy RozhodnutieRow: Id, Court, Cislo, Senat, Ecli, DatumRozhodnutia, Kolegium, Merito, SourceUrl (filterable: court, cislo, senat, ecli, datum, kolegium;
-- sortable: court, cislo, datum). Differences: cislo is an escaped ILIKE prefix (the legacy had only equality), the sort modes are an enum, kolegium_nazov, sudca and
-- text_source are added. The sort is a CASE on the enum (no dynamic SQL); a missing date is last in both directions and the id breaks ties. total is a window
-- count: the size of the filtered set, constant across pages.
WITH prm AS (
    SELECT COALESCE(NULLIF(btrim(@sort), ''), 'datum_desc') AS sort,
           LEAST(GREATEST(COALESCE(@limit, 20), 1), 50)::int AS lim,
           GREATEST(COALESCE(@offset, 0), 0)::int AS off
),
f AS (
    SELECT d.*
      FROM rozhodnutia d
     WHERE (@cislo IS NULL OR d.cislo ILIKE replace(replace(replace(@cislo, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
       AND (@ecli IS NULL OR d.ecli = @ecli)
       AND (@court IS NULL OR d.court = @court)
       AND (@kolegium IS NULL OR d.kolegium = CAST(@kolegium AS text))
       AND (@senat IS NULL OR d.senat = @senat)
       AND (@datum_from IS NULL OR d.datum_rozhodnutia >= CAST(@datum_from AS date))
       AND (@datum_to IS NULL OR d.datum_rozhodnutia <= CAST(@datum_to AS date))
)
SELECT f.id,
       f.court,
       f.cislo,
       f.senat,
       f.ecli,
       f.datum_rozhodnutia,
       f.kolegium,
       f.kolegium_nazov,
       f.merito,
       f.sudca,
       f.source_url,
       f.text_source,
       count(*) OVER () AS total
  FROM f
 CROSS JOIN prm
 ORDER BY CASE WHEN prm.sort = 'datum_asc' THEN f.datum_rozhodnutia END ASC NULLS LAST,
          CASE WHEN prm.sort = 'datum_desc' THEN f.datum_rozhodnutia END DESC NULLS LAST,
          CASE WHEN prm.sort = 'cislo' THEN f.cislo END ASC,
          f.datum_rozhodnutia DESC NULLS LAST, f.cislo, f.id
 LIMIT (SELECT lim FROM prm) OFFSET (SELECT off FROM prm)
