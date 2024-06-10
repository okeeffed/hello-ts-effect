import { Effect, Context, Option, Layer, pipe } from "effect";
import * as z from "zod";

/**
 * POSSIBLE ERRORS
 */
class ZodError {
  readonly _tag = "ZodError";
  readonly errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    this.errors = errors;
  }
}

class DatabaseConnectionFailed {
  readonly _tag = "DatabaseConnectionFailed";
  readonly name = "DatabaseConnectionFailed";
  readonly message = "Failed to connect to the database";
}

/**
 * SCHEMA
 */
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
});

const handleSafeParse = <a, b>(result: z.SafeParseReturnType<a, b>) => {
  if (result.success) {
    return Effect.succeed(result.data);
  }

  return Effect.fail(new ZodError(result.error.errors));
};

const validUserName = (name: string) =>
  pipe(
    Effect.succeed(name),
    Effect.andThen(z.string().safeParse),
    Effect.andThen(handleSafeParse)
  );

export type User = z.infer<typeof userSchema>;

/**
 * SERVICE
 */

interface IUserService {
  getUser: (id: string) => Effect.Effect<User, DatabaseConnectionFailed>;
  changeUserName: (user: User, name: string) => Effect.Effect<User, ZodError>;
}

export class UserService extends Context.Tag("UserService")<
  UserService,
  IUserService
>() {}

class ConcreteUserService implements IUserService {
  getUser: (id: string) => Effect.Effect<User, DatabaseConnectionFailed> = (
    id: string
  ) =>
    Effect.gen(function* () {
      yield* Effect.annotateLogsScoped({
        caller: "UserService.getUser()",
      });

      // Randomly return database error
      if (Math.random() < 0.3) {
        return yield* Effect.fail(new DatabaseConnectionFailed());
      }

      const user = { id, name: "John Doe", age: 25 };
      yield* Effect.annotateLogsScoped({
        userId: id,
      });

      yield* Effect.log("Successfully fetched user from database");

      return user;
    }).pipe(Effect.scoped);

  changeUserName: (user: User, name: string) => Effect.Effect<User, ZodError> =
    (user: User, name: string) =>
      Effect.gen(function* () {
        const newName = yield* validUserName(name);

        return {
          ...user,
          name: newName,
        };
      });
}

/**
 * CONTROLLER
 */
interface IUserController {
  readonly getUser: (
    id: string
  ) => Effect.Effect<User, ZodError | DatabaseConnectionFailed, UserService>;
}

export class UserController extends Context.Tag("UserController")<
  UserController,
  IUserController
>() {}

class ConcreteUserController implements IUserController {
  getUser = (id: string) =>
    Effect.gen(function* () {
      yield* Effect.annotateLogsScoped({
        caller: "UserService.getUser()",
      });
      const userService = yield* UserService;
      yield* Effect.log("Valid service acquired");

      const user = yield* userService.getUser(id);
      yield* Effect.log("Successfully fetched user");

      return user;
    }).pipe(Effect.scoped);
}

export const program = Effect.gen(function* () {
  yield* Effect.annotateLogsScoped({
    caller: "program()",
  });

  // Acquire instances of the 'Random' and 'Logger' services
  const userController = yield* UserController;
  yield* Effect.log("Valid controller acquired");

  const user = yield* userController.getUser("1");
  yield* Effect.log("Successfully fetched user");

  yield* Effect.annotateLogsScoped({
    userId: user.id,
  });
  yield* Effect.log("Successfully parsed");

  return user;
}).pipe(
  Effect.catchTags({
    ZodError: (zodError) => {
      console.log(zodError.errors);

      return Effect.succeed("Recovered from Zod error");
    },
    DatabaseConnectionFailed: (dbError) => {
      console.log(dbError.message);

      return Effect.succeed("Recovered from database error");
    },
  }),

  Effect.scoped
);

const userController = Layer.succeed(
  UserController,
  new ConcreteUserController()
);
const concreteUserService = new ConcreteUserService();
const userService = Layer.succeed(UserService, concreteUserService);

// Provide service implementations for 'Random' and 'Logger'
const runnable = Effect.provide(
  program,
  Layer.merge(userController, userService)
);

// Run the program
// Effect.runPromise(runnable).then(console.log);

/**
 * WHEN RUNNING TESTS
 */
export class TestContext extends Context.Tag("TestContext")<
  TestContext,
  {
    readonly throwUserServiceError: boolean;
  }
>() {}

class TestUserService implements IUserService {
  getUser: (id: string) => Effect.Effect<User, DatabaseConnectionFailed> = (
    id: string
  ) =>
    Effect.gen(function* () {
      const testContext = yield* Effect.serviceOption(TestContext);

      if (Option.isNone(testContext)) {
        return { id, name: "John Doe", age: 25 };
      }

      const { throwUserServiceError } = testContext.value;

      if (throwUserServiceError) {
        return yield* Effect.fail(new DatabaseConnectionFailed());
      }

      return { id, name: "John Doe", age: 25 };
    }).pipe(Effect.scoped);

  changeUserName: (user: User, name: string) => Effect.Effect<User, ZodError> =
    (user: User, name: string) => Effect.succeed({ ...user, name });
}
const testUserService = Layer.succeed(UserService, new TestUserService());
const testContext = Layer.succeed(TestContext, { throwUserServiceError: true });
const testContextFalse = Layer.succeed(TestContext, {
  throwUserServiceError: false,
});

// Effect.runPromiseExit(
//   Effect.provide(
//     program,
//     Layer.mergeAll(userController, testUserService, testContext)
//   )
// ).then(console.log);
Effect.runPromiseExit(
  Effect.provide(
    program,
    Layer.mergeAll(userController, testUserService, testContext)
  )
).then(console.log);

// Alternative approach to providing services
// Effect.runPromiseExit(
//   Effect.provide(program, Layer.mergeAll(userController, testUserService)).pipe(
//     Effect.provideService(TestContext, { throwUserServiceError: true }),
//     Effect.catchTags({
//       ZodError: (zodError) => Effect.succeed("Handled"),
//       DatabaseConnectionFailed: (dbError) => Effect.succeed("Handled"),
//     })
//   )
// ).then(console.log);
