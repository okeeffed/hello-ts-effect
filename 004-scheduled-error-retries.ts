import { Effect, Either, Random, pipe, Console, Schedule } from "effect";

class FooError {
  readonly _tag = "FooError";
}
class BarError {
  readonly _tag = "BarError";
}

const program = Effect.gen(function* () {
  console.log("Running program...");
  const n1 = yield* Random.next;
  const n2 = yield* Random.next;

  const foo = n1 > 0.5 ? "yay!" : yield* Effect.fail(new FooError());

  const bar = n2 > 0.8 ? "yay!" : yield* Effect.fail(new BarError());

  return foo + bar;
});

// Define a repetition policy using a fixed delay between retries
const policy = Schedule.fixed("1 second");
const repeated = Effect.retry(program, { times: 2, schedule: policy });

const catchTags = repeated.pipe(
  Effect.catchTags({
    FooError: (_fooError) => Effect.succeed(`Recovering from FooError`),
    BarError: (_barError) => Effect.succeed(`Recovering from BarError`),
  })
);

// Effect.runPromise(program).then(console.log, console.error);
// Effect.runPromise(recovered).then(console.log, console.error);
Effect.runPromise(catchTags).then(console.log, console.error);
