-- guide: the text is a constant SELECT; the C# test reads it through the Tool. Here: the schema the guide documents exists (tables and the FTS configuration name).
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'rozhodnutia')
   AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = 'rozhodnutia'::regclass AND a.attname = 'search_vector') AS ok
