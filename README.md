# dp-sk-judikatura

Data Package `sk-judikatura` (open-lex-it, phase 81): decisions of the Supreme Court of the Slovak Republic (Najvyssi sud SR) from the OpenData service
`https://www.nsud.sk/opendata/` (REST endpoint `https://www.nsud.sk/ws/opendata.php`). Dataset schema `ds_sk_judikatura`.

## Layout

| Path | Content |
|---|---|
| `dataplatform.json` | Manifest: Source type `nsud-decisions`, pipeline detect, grab, convert, ingest, embed, dataset |
| `schema/migrations/` | `0001_init.sql` (4 tables), `0002_search.sql` (generated `search_vector`, indexes) |
| `serving/dataset.odcs.yaml` | data contract (columns, `largeValue` text columns, search properties) |
| `serving/tools/public/` | curated Tools (plan-b of the phase; none in this release) |
| `tests/sql/`, `tests/conformance/` | the package's own SQL tests and the detect/embed conformance files |

## Schema `ds_sk_judikatura`

| Table | Content |
|---|---|
| `rozhodnutia` | one row per decision, identity `(fonte, source_id)`; court, cislo, senat, ecli, datum, kolegium, merito, sudca, `text_raw`, `text_source` (api, pdf, ocr), urls, `pii_flags`, generated `search_vector` |
| `passages` | embeddable passages of a decision (`text_contextual` is what is embedded), `embedding vector(1024)` HNSW cosine |
| `skipped` | items seen but not turned into a decision, with the reason |
| `coverage` | ids listed versus taken per decision-date window |

## Source `nsud-decisions`

| Setting | Meaning |
|---|---|
| `annoFrom`, `annoTo` | range of decision-date years (the site holds nothing before 2005; default: 2005 to the current year) |
| `ids` | explicit nsud decision ids (sample filter, at most 50): one item, no window call |
| `maxDocs` | sample filter: at most N decisions per month |
| `includePdfOnly` | default true: decisions without API text are read from the PDF attachment (text layer, local OCR as the fallback) |
| `verifyTls`, `delaySeconds`, `baseUrl` | TLS (leave on), pause between requests (default 0.4 s, minimum 0.3 s), base URL (replay servers only) |
| `refreshToken` | change it to fetch every month again (a dry Run completes Catalog items, so a real Run after a dry one needs a new token) |
| `tokenBudget`, `dryRun` | embedding budget per Run (default 20000) and the embedding dry run |

Enumeration is by decision-date windows `searchDecision&art_datrozh_od/do`. The documented `getLastDecision` answers 504 on every call and the documented
`art_datum_od/do` names are ignored by the API; a list is capped at 1000 ids, so a window that answers 1000 is halved down to a day (a day at the cap fails
the item with `window_capped`).

## Pins

Classes (all `0ics-srls`, tag `v0.1.0`): `dp-sk-judikatura-detect`, `dp-sk-judikatura-grab`, `dp-sk-judikatura-convert`, `dp-sk-judikatura-ingest`; shared
embed class `dp-lex-embed@dp-p7.1`. Full-text configuration `sk_unaccent` (simple + unaccent: diacritics folded, no stemming; migration 0003, the Host creates the `unaccent` extension, D142;
the generated column is `search_vector_sk`, the old `search_vector` of 0.1.0 and 0.2.0 stays unused because migrations cannot drop).

## Posture and licence

Decisions are published anonymised by the Court; the package adds no NER, it counts strings shaped like a birth number, IBAN, e-mail or phone number
(`pii_flags`, never blocking). The judge named in the header (`sudca`) is kept: a public official acting in office. The OpenData page names no licence
(licence entry `open-data-unnamed`): a public Grant waits for the user's decision. Case law is not a source of law by itself.

## Tools (Gateway names `sk-judikatura_<tool>`)

| Tool | Purpose |
|---|---|
| `search` | hybrid search (sk_unaccent full-text + best passage, RRF); filters `court`, `kolegium`, `datum_from`, `datum_to`; `mode` hybrid, lexical, semantic; `k` 1..50; no query lists the newest decisions |
| `rozhodnutie` | one decision by `id`, `ecli` or `cislo` (exactly one), text in slices (`offset`, `length`, `next_offset`) |
| `lookup` | structured list by extremes (replaces the never exposed branch-53 `query_judikatura`), paging with `total`, never the text |
| `guide` | usage text for agents (Slovak, short Italian section) and the honest limits |
| `status` | live coverage per court from the data (counts, years, text source mix, pending embeddings, skipped by reason, coverage windows) |

`search` and `lookup` accept an empty call (a Screen opens with it). Generated Tools of the four tables never return `text_raw`, `text` or `text_contextual`
(`largeValue`). Differences from the legacy `search_judikatura` / `get_rozhodnutie`: `mode`, `kolegium` and `k > 50` is an error instead of a clamp, an unknown
decision answers no row instead of 404, the text comes in slices, PDF-only decisions exist here and not in the legacy (its reader rejected an empty `obsah`).

## Release 0.1.0 and 0.2.0

0.1.0 carries the data and the Tools, 0.2.0 adds the Screens (`ui/`, committed deterministic `ui/dist`, see `ui/BUILD-NOTES.md`) and pins grab 0.1.1 (stores the
decision page URL).

## Screens (Console menu "Slovak case law" / "Judikatúra SR" / "Giurisprudenza slovacca")

| Screen | Element | Purpose |
|---|---|---|
| `corpus` (default) | `dp-sk-judikatura-corpus` | newest decisions with no search (`lookup`), search with filters (`search`), lookup by case number or ECLI |
| `decision` | `dp-sk-judikatura-decision` | header, text slices (`rozhodnutie`), text source and shape-guard badges, PDF and source links; route `dec~<uuid>` |
| `status` | `dp-sk-judikatura-status` | corpus coverage from the `status` Tool |

The Screens call only `search`, `lookup`, `rozhodnutie` and `status`; labels exist in sk, en and it.

## Version history

See `releases.breakingChanges` in the Manifest.
