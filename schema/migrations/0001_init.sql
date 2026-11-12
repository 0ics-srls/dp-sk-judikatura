-- dp-sk-judikatura 0001: the four tables. Additive and idempotent; applied by the Host as ds_sk_judikatura_rw with search_path ds_sk_judikatura, public.
-- No foreign keys: ingest replaces the passages of a decision in one transaction (P81-07). The pgvector extension is provided by the Host.

-- Decisions of the Supreme Court of the Slovak Republic (nsud.sk OpenData). Identity is (fonte, source_id); the ECLI is not unique and exists only from 2011.
-- text_source says where text_raw came from: the API field obsah (api), the text layer of the PDF attachment (pdf) or local OCR of a scan (ocr).
CREATE TABLE IF NOT EXISTS rozhodnutia (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fonte text NOT NULL,
    source_id text NOT NULL,
    court text NOT NULL,
    cislo text NOT NULL,
    senat text,
    ecli text,
    datum_rozhodnutia date,
    kolegium text,
    kolegium_nazov text,
    merito text,
    sudca text,
    text_raw text NOT NULL,
    text_source text NOT NULL,
    source_url text,
    pdf_url text,
    pii_flags integer NOT NULL DEFAULT 0,
    ingested_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rozhodnutia_text_source_chk CHECK (text_source IN ('api', 'pdf', 'ocr')),
    CONSTRAINT rozhodnutia_court_chk CHECK (court IN ('NSSR', 'NSSSR')),
    CONSTRAINT rozhodnutia_text_raw_not_blank_chk CHECK (length(btrim(text_raw)) > 0),
    CONSTRAINT rozhodnutia_fonte_source_id_uq UNIQUE (fonte, source_id)
);

-- Passages of a decision (the best passage per decision feeds the semantic search). embedding is filled by the embed step.
CREATE TABLE IF NOT EXISTS passages (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rozhodnutie_id uuid NOT NULL,
    seq integer NOT NULL,
    text text NOT NULL,
    text_contextual text NOT NULL,
    embedding vector(1024),
    CONSTRAINT passages_rozhodnutie_seq_uq UNIQUE (rozhodnutie_id, seq)
);

-- Items the pipeline saw but did not turn into a decision (no text, OCR failures, parse errors, PDF-only while disabled).
CREATE TABLE IF NOT EXISTS skipped (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fonte text NOT NULL,
    item_ref text NOT NULL,
    reason text NOT NULL,
    seen_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT skipped_fonte_item_ref_uq UNIQUE (fonte, item_ref)
);

-- Listed versus taken per decision-date window: ids the search answered, ids ingested, how many of them had only a PDF.
CREATE TABLE IF NOT EXISTS coverage (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fonte text NOT NULL,
    window_from date NOT NULL,
    window_to date NOT NULL,
    ids_listed integer NOT NULL DEFAULT 0,
    ids_taken integer NOT NULL DEFAULT 0,
    pdf_only integer NOT NULL DEFAULT 0,
    noted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT coverage_window_uq UNIQUE (fonte, window_from, window_to)
);
