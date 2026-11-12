/** The Tools the Screens use; every value must exist in `serving/tools/public` (the contract audit proves it). Bare names (the Gateway prefix is not used by the Console). */
export enum JudikaturaTool {
  Search = 'search',
  Lookup = 'lookup',
  Rozhodnutie = 'rozhodnutie',
  Status = 'status',
}

/** Tool -> the (snake case) input keys its facade method may send; mirrors the `parameters` of the Tool JSON. */
export const TOOL_INPUT_KEYS: Readonly<Record<JudikaturaTool, readonly string[]>> = {
  [JudikaturaTool.Search]: ['query', 'k', 'mode', 'court', 'kolegium', 'datum_from', 'datum_to'],
  [JudikaturaTool.Lookup]: ['cislo', 'ecli', 'court', 'kolegium', 'senat', 'datum_from', 'datum_to', 'sort', 'limit', 'offset'],
  [JudikaturaTool.Rozhodnutie]: ['id', 'ecli', 'cislo', 'offset', 'length'],
  [JudikaturaTool.Status]: [],
};
