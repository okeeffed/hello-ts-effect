import { Effect, Context } from "effect";

// 1. Declare the effect
const basicSucceed = Effect.sync(() => Effect.succeed("Value"));

// 2. Run the effect
Effect.runPromise(basicSucceed).then(console.log);

// Supplying an service
class Config extends Context.Tag("MyConfigService")<
  Config,
  { readonly getUrl: Effect.Effect<string> }
>() {}

const program = Effect.gen(function* () {
  const config = yield* Config;
  const url = yield* config.getUrl;
  return url;
});

const runnable = program.pipe(
  Effect.provideService(Config, {
    getUrl: Effect.succeed("https://example.com"),
  })
);

Effect.runPromise(runnable).then(console.log);

// Managing services with layers
