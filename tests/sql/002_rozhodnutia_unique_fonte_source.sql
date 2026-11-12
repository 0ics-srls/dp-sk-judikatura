DELETE FROM passages;
DELETE FROM rozhodnutia;

INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', '150000', 'NSSR', '8Cdo/21/2014', 'text rozhodnutia', 'api');

-- the same (fonte, source_id) is refused, another source_id or another fonte is accepted
DO $$
BEGIN
    INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', '150000', 'NSSR', '8Cdo/22/2014', 'iny text', 'api');
    RAISE EXCEPTION 'duplicate (fonte, source_id) was accepted';
EXCEPTION WHEN unique_violation THEN
    NULL;
END $$;

INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', '150001', 'NSSR', '8Cdo/22/2014', 'iny text', 'api');
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('other', '150000', 'NSSR', '8Cdo/23/2014', 'treti text', 'api');

-- an ECLI is not unique (legacy index non-unique): two decisions may share one
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, ecli, text_raw, text_source) VALUES ('nsud', '1', 'NSSR', '1Cdo/1/2020', 'ECLI:SK:NSSR:2020:1.1', 't', 'api'), ('nsud', '2', 'NSSR', '1Cdo/2/2020', 'ECLI:SK:NSSR:2020:1.1', 't', 'api');

SELECT count(*) = 5 AS ok FROM rozhodnutia
