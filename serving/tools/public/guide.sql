-- guide: the usage text for agents (constant). Slovak first, a short Italian section after it. Gateway names carry a hyphen (D116).
SELECT $guide$
SLOVENSKÁ JUDIKATÚRA - rozhodnutia Najvyššieho súdu Slovenskej republiky (NS SR)

CO OBSAHUJE
Rozhodnutia Najvyššieho súdu SR zo služby OpenData portálu nsud.sk (od roku 2005; rozhodnutia správneho kolégia sú vedené pod NSSR, kód NSSSR je pripravený pre Najvyšší správny súd). Pre každé rozhodnutie: značka (cislo), ECLI (len rozhodnutia po júli 2011), dátum, kolégium (1 občianskoprávne, 2 obchodnoprávne, 3 správne, 4 trestnoprávne), predmet (merito), sudca zo záhlavia a plný text.

KTORÝ NÁSTROJ
- sk-judikatura_search: hľadanie. query (syntax webového vyhľadávania: "presná fráza", slovo OR slovo, -vylúč), mode hybrid (predvolené: fulltext + sémantické poradie), lexical alebo semantic, filtre court, kolegium, datum_from, datum_to, k (1 až 50). Bez query vypíše najnovšie rozhodnutia.
- sk-judikatura_rozhodnutie: jedno rozhodnutie podľa id, ecli alebo cislo (napr. 8Cdo/21/2014, s lomkou, bez kódovania); text po častiach (offset, length, next_offset).
- sk-judikatura_lookup: štruktúrovaný zoznam podľa značky, ECLI, súdu, kolégia, senátu a dátumu bez textu; stránkovanie limit/offset.
- sk-judikatura_status: skutočné pokrytie korpusu z dát (počty, roky, pôvod textu, nespracované položky, okná zberu).
- sk-judikatura_guide: tento text.

AKO ČÍTAŤ VÝSLEDKY
text_source: api = text z API, pdf = textová vrstva prílohy PDF, ocr = lokálne OCR skenu. Rozhodnutia pred rokom 2014 majú text len v prílohe PDF. headline označuje zhodu «takto» (len pri fulltextovej zhode), snippet je najbližší úsek textu.

POCTIVÉ LIMITY
- Iba Najvyšší súd SR (NS SR): nie sú tu súdy nižších stupňov ani Ústavný súd SR. Ide o rozhodnutia, ktoré súd zverejnil v službe OpenData, nie o všetky rozhodnutia.
- Fulltext používa konfiguráciu sk_unaccent (simple + unaccent): veľkosť písmen aj diakritika sa skladajú (zalobca nájde žalobca), ale bez stemmingu. Ohnuté tvary (zmenka, zmenky, zmenke) sú rôzne slová; sémantické poradie to čiastočne vyrovnáva.
- Rozhodnutia anonymizuje súd pred zverejnením; balík nepoužíva NER, iba počíta reťazce tvaru rodné číslo, IBAN, e-mail a telefón (pii_flags) a nikdy ich nemaže ani neblokuje.
- Licencia: stránka OpenData nepomenúva licenciu (voľné použitie na akýkoľvek účel); rozhodnutia súdov nie sú autorským dielom. Zdroj: nsud.sk OpenData.
- Judikatúra nie je prameňom práva sama osebe; cituj značku a ECLI.

SINTESI IN ITALIANO
Corte suprema della Repubblica slovacca (Najvyšší súd, NS SR), dati aperti nsud.sk dal 2005. Strumenti: sk-judikatura_search (ricerca ibrida), sk-judikatura_rozhodnutie (testo a porzioni), sk-judikatura_lookup (elenco per estremi), sk-judikatura_status (copertura reale), sk-judikatura_guide. Limiti: solo la Corte suprema, niente giudici inferiori, FTS "simple" senza stemming, testo pre-2014 da PDF o OCR, anonimizzazione a cura della Corte. La giurisprudenza non e'' fonte di diritto.
$guide$ AS text
