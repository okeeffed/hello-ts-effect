import { Effect, pipe } from "effect";

const ugly = (a: number, b: number) =>
  b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b);

const nice = (a: number, b: number) =>
  Effect.suspend(() =>
    b === 0
      ? Effect.fail(new Error("Cannot divide by zero"))
      : Effect.succeed(a / b)
  );

// Taking existing functions and turning them insto effects
const simple = (a: number, b: number) => a / b;

const niceEffect = (a: number, b: number) =>
  Effect.suspend(() =>
    Effect.try({
      try: () => simple(a, b),
      catch: (e) => new Error("Something went wrong	"),
    })
  );

const program = Effect.gen(function* () {
  const result = yield* nice(10, 2);
  yield* ugly(10, 0);
  return result;
});

Effect.runPromiseExit(program).then(console.log, console.error);

pipe(
  nice(10, 0),
  Effect.catchAll((e) => Effect.succeed(e.message))
);
