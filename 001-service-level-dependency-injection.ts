import { Context, Effect } from "effect";

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

// Provide service implementations for 'Random' and 'Logger'
const runnable1 = program.pipe(
  Effect.provideService(LoggerService, {
    log: (message: any) => Effect.sync(() => console.log(message)),
  })
);

// Run the program
Effect.runPromise(runnable1);
