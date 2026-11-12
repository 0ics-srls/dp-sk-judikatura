SELECT count(*) = 4 AS ok FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE' AND table_name IN ('rozhodnutia', 'passages', 'skipped', 'coverage')
