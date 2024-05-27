import { Effect } from "effect";

// Divide by zero error
class DivideByZeroError {
  readonly _tag = "DivideByZeroError";
  readonly name = "DivideByZeroError";
  readonly message = "Cannot divide by zero";
}

const divide = (a: number, b: number): Effect.Effect<number, Error, never> =>
  b === 0 ? Effect.fail(new DivideByZeroError()) : Effect.succeed(a / b);

const program = Effect.gen(function* () {
  const result = yield* divide(10, 0);
  return result;
});

Effect.runPromiseExit(program).then(console.log, console.error);
