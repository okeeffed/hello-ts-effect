import { Effect, Either, Random, pipe, Console, Schedule } from "effect";

class FooError {
  readonly _tag = "FooError";
}
class BarError {
  readonly _tag = "BarError";
}

// Alter this between 0 and 1 with closer to 1 being more likely to error
const NEEDLE = 0.6;

const fooFn = Effect.gen(function* () {
  console.log("Running fooFn...");
  const n1 = yield* Random.next;
  const foo = n1 > NEEDLE ? "yay!" : yield* Effect.fail(new FooError());

  return foo;
});

const barFn = Effect.gen(function* () {
  console.log("Running barFn...");
  const n2 = yield* Random.next;
  const bar = n2 > NEEDLE ? "yay!" : yield* Effect.fail(new BarError());

  return bar;
});

// Define a repetition policy using a fixed delay between retries
const policy = Schedule.fixed("1 second");

const fooFnWithRetry = Effect.retry(fooFn, { times: 1, schedule: policy });
const barFnWithRetry = Effect.retry(barFn, { times: 4, schedule: policy });

const program = Effect.gen(function* () {
  console.log("Running program...");
  const n1 = yield* fooFnWithRetry;
  const n2 = yield* barFnWithRetry;

  return n1 + n2;
});

const catchTags = program.pipe(
  Effect.catchTags({
    FooError: (_fooError) => Effect.succeed(`Recovering from FooError`),
    BarError: (_barError) => Effect.succeed(`Recovering from BarError`),
  })
);

// Effect.runPromise(program).then(console.log, console.error);
// Effect.runPromise(recovered).then(console.log, console.error);
Effect.runPromise(catchTags).then(console.log, console.error);
