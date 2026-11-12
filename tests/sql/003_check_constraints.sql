DELETE FROM passages;
DELETE FROM rozhodnutia;

DO $$
BEGIN
    INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c1', 'NSSR', 'x', 'text', 'scan');
    RAISE EXCEPTION 'text_source scan was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c2', 'NSSR', 'x', '   ', 'api');
    RAISE EXCEPTION 'blank text was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c3', 'KSBA', 'x', 'text', 'api');
    RAISE EXCEPTION 'court KSBA was accepted';
EXCEPTION WHEN check_violation THEN
    NULL;
END $$;

DO $$
BEGIN
    INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c4', 'NSSR', 'x', NULL, 'api');
    RAISE EXCEPTION 'null text was accepted';
EXCEPTION WHEN not_null_violation THEN
    NULL;
END $$;

-- the legal values are accepted
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c5', 'NSSR', 'x', 'text', 'api');
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c6', 'NSSSR', 'x', 'text', 'pdf');
INSERT INTO rozhodnutia (fonte, source_id, court, cislo, text_raw, text_source) VALUES ('nsud', 'c7', 'NSSR', 'x', 'text', 'ocr');

SELECT count(*) = 3 AS ok FROM rozhodnutia
