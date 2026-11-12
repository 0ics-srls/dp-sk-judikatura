-- the lookup view never carries the text: the lookup column list has no text_raw (checked against the stored columns the Tool must not select)
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'rozhodnutia' AND column_name = 'text_raw')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'rozhodnutia' AND column_name = 'text') AS ok
