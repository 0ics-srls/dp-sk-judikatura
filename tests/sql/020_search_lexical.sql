-- search, lexical side: websearch syntax on the simple vector of merito + text_raw, headline with the legacy markers
DELETE FROM passages;
DELETE FROM rozhodnutia;
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, merito, text_raw, text_source) VALUES
 ('nsud', 't020a', 'NSSR', '1Cdo/1/2098', 'Zmenka', 'Dovolanie proti rozsudku o zmenke bolo zamietnute pre nedostatok dovodov.', 'api'),
 ('nsud', 't020b', 'NSSR', '2Cdo/2/2098', NULL, 'Zmenkovy odpis zmenka pripustny je dovolanie sudu urgentne.', 'api'),
 ('nsud', 't020c', 'NSSR', '3Cdo/3/2098', NULL, 'Nahrada skody bola priznana navrhovatelovi vo vyske tisic eur.', 'api');

SELECT (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', '"proti rozsudku"')) = 1                   -- phrase
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'nahrada OR dovolanie')) = 3             -- OR
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'dovolanie -zamietnute')) = 1           -- minus
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'dovolanie nahrada')) = 0               -- implicit AND
   -- the honest simple behaviour: zmenka finds the word zmenka (merito and text) and NOT zmenkovy / zmenke
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zmenka')) = 2
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zmenkovy')) = 1
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zmenke')) = 1
   AND (SELECT ts_headline('simple', text_raw, websearch_to_tsquery('simple', 'nahrada'), 'StartSel=«,StopSel=»,MaxFragments=2,MaxWords=28,MinWords=8')
          FROM rozhodnutia WHERE source_id = 't020c') LIKE '%«Nahrada»%' AS ok
