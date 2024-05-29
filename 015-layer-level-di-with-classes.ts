import { Context, Effect, Layer } from "effect";

interface ILogger {
  readonly log: (message: string) => Effect.Effect<void>;
}

export class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  ILogger
>() {}

class ConcreteLoggerService implements ILogger {
  log(message: string): Effect.Effect<void> {
    return Effect.sync(() => console.log(message));
  }
}

export class DatabaseConnectionFailed {
  readonly _tag = "DatabaseConnectionFailed";
  readonly name = "DatabaseConnectionFailed";
  readonly message = "Failed to connect to the database";
}

interface IDatabase {
  readonly get: (
    manualFail?: boolean
  ) => Effect.Effect<void, DatabaseConnectionFailed>;
}

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  IDatabase
>() {}

class ConcreteDatabaseService implements IDatabase {
  get(manualFail?: boolean): Effect.Effect<void, DatabaseConnectionFailed> {
    if (manualFail) {
      return Effect.fail(new DatabaseConnectionFailed());
    }

    return Effect.sync(() => console.log("Getting data from the database"));
  }
}

export const program = Effect.gen(function* () {
  // Acquire instances of the 'Random' and 'Logger' services
  const logger = yield* LoggerService;
  const database = yield* DatabaseService;

  yield* database.get();

  // Log the random number using the 'Logger' service
  yield* logger.log("Hello, world!");

  return true;
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
