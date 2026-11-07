/**
 * Use in the `default` branch of a switch over a union.
 * If a case is missing, `x` isn't `never` and the call fails to compile.
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
