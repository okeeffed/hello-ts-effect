import { Effect } from "effect";

// Divide by zero error
class DivideByZeroError {
  readonly _tag = "DivideByZeroError";
  readonly name = "DivideByZeroError";
  readonly message = "Cannot divide by zero";
}

const connectToDb = () => {
  throw new Error("Something unexpected happened");
};

const divide = (a: number, b: number) => {
  connectToDb();
  return b === 0 ? Effect.fail(new DivideByZeroError()) : Effect.succeed(a / b);
};

const program = Effect.gen(function* () {
  const result = yield* divide(10, 0);
  return result;
});

Effect.runPromise(
  program.pipe(
    // Effect.catchTag(DivideByZeroError , () => Effect.succeed("Cannot divide by zero")
    Effect.catchAll((e) => Effect.succeed(e.message))
  )
).then(console.log, console.error);
