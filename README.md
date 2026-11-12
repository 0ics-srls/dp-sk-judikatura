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
embed class `dp-lex-embed@dp-p7.1`. Full-text configuration `simple` (no stemming, no accent folding: the Host creates only the `vector` extension, so the
D142 `sk_unaccent` configuration could not be created, decision P81-22).

## Posture and licence

Decisions are published anonymised by the Court; the package adds no NER, it counts strings shaped like a birth number, IBAN, e-mail or phone number
(`pii_flags`, never blocking). The judge named in the header (`sudca`) is kept: a public official acting in office. The OpenData page names no licence
(licence entry `open-data-unnamed`): a public Grant waits for the user's decision. Case law is not a source of law by itself.

## Tools

The five Tools (`search`, `rozhodnutie`, `lookup`, `guide`, `status`) arrive with release 0.1.0 (plan-b), the Screens with 0.2.0 (plan-c).

## Version history

See `releases.breakingChanges` in the Manifest.
