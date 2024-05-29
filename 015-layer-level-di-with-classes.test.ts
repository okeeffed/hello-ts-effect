import { Cause, Effect, Exit, Layer } from "effect";
import {
  DatabaseConnectionFailed,
  DatabaseService,
  LoggerService,
  program,
} from "./015-layer-level-di-with-classes";

describe("layer level di", () => {
  test.each([
    {
      case: "expect successful exist",
      loggerServiceInstance: {
        log: jest.fn(() => Effect.void),
      },
      databaseServiceInstance: {
        get: jest.fn(() => Effect.void),
      },
    },
    {
      case: "expect DatabaseConnectionFailed error to be raise",
      loggerServiceInstance: {
        log: jest.fn(() => Effect.void),
      },
      databaseServiceInstance: {
        get: () => Effect.fail(new DatabaseConnectionFailed()),
      },
      errorClass: DatabaseConnectionFailed,
    },
  ])(
    "$case",
    async ({ databaseServiceInstance, loggerServiceInstance, errorClass }) => {
      const loggerService = Layer.succeed(LoggerService, loggerServiceInstance);
      const databaseService = Layer.succeed(
        DatabaseService,
        databaseServiceInstance
      );
      const runnable = Effect.provide(
        program,
        Layer.merge(loggerService, databaseService)
      );

      const res = await Effect.runPromiseExit(runnable);

      Exit.match(res, {
        onSuccess: (value) => {
          expect(value).toEqual(true);
        },
        onFailure: (cause) => {
          const [failure] = Cause.failures(cause);
          expect(failure).toBeInstanceOf(errorClass);
        },
      });
    }
  );
});
