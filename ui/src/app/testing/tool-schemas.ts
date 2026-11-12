import Ajv2020 from 'ajv/dist/2020';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PACKAGE_ROOT = resolve(process.cwd(), '..');
const ajv = new Ajv2020({ strict: false, validateFormats: false, allErrors: true });

type Validate = ReturnType<typeof ajv.compile>;

const compiled = new Map<string, Validate>();

function validatorOf(tool: string): Validate {
  const cached = compiled.get(tool);
  if (cached !== undefined) {
    return cached;
  }
  const json = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'serving', 'tools', 'public', `${tool}.json`), 'utf8')) as { parameters: object };
  const validate = ajv.compile(json.parameters);
  compiled.set(tool, validate);
  return validate;
}

/** null when the input is valid for the real Tool schema of the package (serving/tools/public), else a readable list of the violations. */
export function inputViolations(tool: string, input: object): string | null {
  const validate = validatorOf(tool);
  if (validate(input)) {
    return null;
  }
  return (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message ?? 'invalid'}`).join('; ');
}
