import { Context, Effect, Layer } from "effect";

interface ILogger {
  readonly log: (message: string) => Effect.Effect<void>;
}

class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  ILogger
>() {}

class ConcreteLoggerService implements ILogger {
  log(message: string): Effect.Effect<void> {
    return Effect.sync(() => console.log(message));
  }
}

interface IDatabase {
  readonly get: () => Effect.Effect<void>;
}

class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  IDatabase
>() {}

class ConcreteDatabaseService implements IDatabase {
  get(): Effect.Effect<void> {
    return Effect.sync(() => console.log("Getting data from the database"));
  }
}

const program = Effect.gen(function* () {
  // Acquire instances of the 'Random' and 'Logger' services
  const logger = yield* LoggerService;
  const database = yield* DatabaseService;

  yield* database.get();

  // Log the random number using the 'Logger' service
  return yield* logger.log("Hello, world!");
});

const loggerService = Layer.succeed(LoggerService, new ConcreteLoggerService());
const databaseService = Layer.succeed(
  DatabaseService,
  new ConcreteDatabaseService()
);

// Provide service implementations for 'Random' and 'Logger'
const runnable = Effect.provide(
  program,
  Layer.merge(loggerService, databaseService)
);

// Run the program
Effect.runPromise(runnable);
