-- search, fusion: reciprocal rank fusion k = 60 keyed by decision id; a row in both lists beats rows in one list; a tie goes to the lexical rank
DELETE FROM passages;
DELETE FROM rozhodnutia;
SELECT (SELECT 1.0 / (60 + 1) + 1.0 / (60 + 2)) > (SELECT 1.0 / (60 + 1))
   AND (1.0 / (60 + 1)) > (1.0 / (60 + 2))
   -- both lists contribute: the sum of the two best ranks is larger than the best single rank
   AND (SELECT round((1.0 / (60 + 1) + 1.0 / (60 + 1))::numeric, 6)) = 0.032787 AS ok
