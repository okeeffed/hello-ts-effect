import { Context, Effect, Layer } from "effect";

interface ILogger {
  readonly log: (message: string) => Effect.Effect<void>;
}

class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  ILogger
>() {}

const program = Effect.gen(function* () {
  // Acquire instances of the 'Random' and 'Logger' services
  const logger = yield* LoggerService;

  // Log the random number using the 'Logger' service
  return yield* logger.log("Hello, world!");
});

const loggerService = Layer.effect(
  LoggerService,
  Effect.gen(function* () {
    return {
      log: (message: any) => Effect.sync(() => console.log(message)),
    };
  })
);

// Provide service implementations for 'Random' and 'Logger'
const runnable = Effect.provide(program, loggerService);

// Run the program
Effect.runPromise(runnable);
