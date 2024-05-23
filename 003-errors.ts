import { Effect, Either, Random, pipe, Console } from "effect";

class FooError {
  readonly _tag = "FooError";
}
class BarError {
  readonly _tag = "BarError";
}

const program = Effect.gen(function* () {
  const n1 = yield* Random.next;
  const n2 = yield* Random.next;

  const foo = n1 > 0.5 ? "yay!" : yield* Effect.fail(new FooError());

  const bar = n2 > 0.5 ? "yay!" : yield* Effect.fail(new BarError());

  return foo + bar;
});

const recovered = Effect.gen(function* () {
  const failureOrSuccess = yield* Effect.either(program);
  if (Either.isLeft(failureOrSuccess)) {
    // failure case: you can extract the error from the `left` property
    const error = failureOrSuccess.left;
    return `Recovering from ${error._tag}`;
  } else {
    // success case: you can extract the value from the `right` property
    return failureOrSuccess.right;
  }
});

const rollback = Effect.gen(function* () {
  // Placeholders
  console.log("Rollback A");
  console.log("Rollback B");

  return Effect.succeed("Rollback completed");
});

const handleRollback = pipe(rollback);

const catchTags = program.pipe(
  Effect.catchTags({
    FooError: (_fooError) => handleRollback,
    BarError: (_barError) => Effect.succeed(`Recovering from BarError`),
  })
);

// Effect.runPromise(program).then(console.log, console.error);
// Effect.runPromise(recovered).then(console.log, console.error);
Effect.runPromise(catchTags).then(console.log, console.error);
