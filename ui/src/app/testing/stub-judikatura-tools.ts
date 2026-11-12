import { signal, type Provider, type WritableSignal } from '@angular/core';
import { PACKAGE_CONTEXT, type PackageScreenContext } from '@olx/package-ui-sdk';
import { createPackageContext, createStubAssets, type ToolHandler } from '@olx/package-ui-sdk/testing';
import { inputViolations } from './tool-schemas';

export interface ToolCallRecord {
  readonly tool: string;
  readonly input: object;
}

export interface StubJudikaturaEnvironment {
  readonly context: WritableSignal<PackageScreenContext>;
  readonly calls: ToolCallRecord[];
  readonly providers: Provider[];
  /** Replaces the context with a copy that has the given overrides (a NEW object, like the Host does). */
  update(overrides: Partial<PackageScreenContext>): void;
}

/**
 * Context signal + recording tools for specs of the facade, stores and Screens. Handlers may return rows, an envelope `{ data, warnings }` or reject.
 * Every input is validated against the REAL Tool JSON schema of the package before the handler runs: an argument object the Tool would answer 400 to
 * rejects here, so a Screen that drifts from the Tool contract fails its spec (P79-56).
 */
export function stubJudikaturaEnvironment(
  handlers: Readonly<Record<string, ToolHandler>> = {},
  overrides: Partial<PackageScreenContext> = {},
): StubJudikaturaEnvironment {
  const calls: ToolCallRecord[] = [];
  const tools = {
    call: async <T>(tool: string, input: object = {}): Promise<T> => {
      calls.push({ tool, input });
      const violations = inputViolations(tool, input);
      if (violations !== null) {
        throw new Error(`invalid input for ${tool}: ${violations}`);
      }
      const handler = handlers[tool];
      if (handler === undefined) {
        throw new Error(`no stub handler for ${tool}`);
      }
      return (await handler(input)) as T;
    },
  };
  const context = signal(createPackageContext({ tools, assets: createStubAssets(), ...overrides }));
  return {
    context,
    calls,
    providers: [{ provide: PACKAGE_CONTEXT, useValue: context }],
    update: (next) => {
      context.update((current) => ({ ...current, ...next }));
    },
  };
}

/** Inputs of the recorded calls of one Tool. */
export function callsOf(env: StubJudikaturaEnvironment, tool: string): object[] {
  return env.calls.filter((call) => call.tool === tool).map((call) => call.input);
}

/** `tool: violations` for every recorded call whose input the real Tool schema rejects (empty when the Screen respects the contract). */
export function schemaViolations(env: StubJudikaturaEnvironment): string[] {
  return env.calls.flatMap((call) => {
    const violations = inputViolations(call.tool, call.input);
    return violations === null ? [] : [`${call.tool}: ${violations}`];
  });
}
