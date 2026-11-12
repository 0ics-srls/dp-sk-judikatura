-- The stored vector uses the simple configuration (D142 fallback: the package role cannot create the unaccent extension).
-- Honest behaviour documented here: lower-case tokens, no stemming, no accent folding.
DELETE FROM passages;
DELETE FROM rozhodnutia;

INSERT INTO rozhodnutia (fonte, source_id, court, cislo, merito, text_raw, text_source)
VALUES ('nsud', 's1', 'NSSR', '8Cdo/1/2020', 'Zmenka a jej preskripcia', 'Dovolanie zalobcu proti rozsudku krajskeho sudu', 'api'),
       ('nsud', 's2', 'NSSR', '8Cdo/2/2020', NULL, 'Žalobca sa domáhal zaplatenia zmenkovej sumy', 'api');

SELECT (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zmenka')) = 1          -- word in merito
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'dovolanie')) = 1      -- word in text_raw
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'ŽALOBCA')) = 1        -- case is folded, diacritics are kept
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zalobca')) = 0        -- honest limit: no accent folding
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'zmenkova')) = 0       -- honest limit: an inflected form is NOT found
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector @@ websearch_to_tsquery('simple', 'inexistent')) = 0 AS ok
