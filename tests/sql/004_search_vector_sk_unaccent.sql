-- The stored vector uses sk_unaccent (D142: simple + unaccent, created by migration 0003; the Host provides the unaccent extension).
-- Behaviour: case folded, diacritics folded (both directions), no stemming.
DELETE FROM passages;
DELETE FROM rozhodnutia;

INSERT INTO rozhodnutia (fonte, source_id, court, cislo, merito, text_raw, text_source)
VALUES ('nsud', 's1', 'NSSR', '8Cdo/1/2020', 'Zmenka a jej preskripcia', 'Dovolanie zalobcu proti rozsudku krajskeho sudu', 'api'),
       ('nsud', 's2', 'NSSR', '8Cdo/2/2020', NULL, 'Žalobca sa domáhal zaplatenia zmenkovej sumy', 'api');

SELECT (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'zmenka')) = 1       -- word in merito
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'dovolanie')) = 1   -- word in text_raw
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'ŽALOBCA')) = 1     -- case folded, diacritics typed
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'zalobca')) = 1     -- diacritics folded: typed without
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'žalobcu')) = 1     -- typed with diacritics, stored without
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'zmenkova')) = 0    -- honest limit: an inflected form is NOT found
   AND (SELECT count(*) FROM rozhodnutia WHERE search_vector_sk @@ websearch_to_tsquery('sk_unaccent'::regconfig, 'inexistent')) = 0 AS ok
