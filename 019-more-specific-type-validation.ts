import { Effect, Console, pipe } from "effect";
import * as z from "zod";

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

export type User = z.infer<typeof userSchema>;

function changeUserName(user: User, name: string) {
  return { ...user, name };
}

class ZodError {
  readonly _tag = "ZodError";
  readonly errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    this.errors = errors;
  }
}

const handleSafeParse = <a, b>(result: z.SafeParseReturnType<a, b>) => {
  if (result.success) {
    return Effect.succeed(result.data);
  }

  return Effect.fail(new ZodError(result.error.errors));
};

const reverseString = (input: string) => input.split("").reverse().join("");

const program = pipe(
  Effect.succeed({
    name: "John Doe",
    age: 25,
  }),
  Effect.andThen((user) => handleSafeParse(userSchema.safeParse(user))),
  Effect.tap(console.log),
  Effect.andThen((user) =>
    Effect.all([
      Effect.succeed(user),
      handleSafeParse(z.string().safeParse("Jane Doe")),
    ])
  ),
  Effect.andThen(([user, name]) => changeUserName(user, name)),
  Effect.catchTags({
    ZodError: (zodError) => {
      console.log(zodError.errors);

      return Effect.succeed("Recovered from Zod error");
    },
  })
);

const validUserName = (name: string) =>
  pipe(
    Effect.succeed(name),
    Effect.andThen(z.string().safeParse),
    Effect.andThen(handleSafeParse)
  );

const programGen = Effect.gen(function* () {
  try {
    const user = yield* Effect.succeed({
      name: "John Doe",
      age: 25,
    });

    const res = userSchema.safeParse(user);
    const parsedUser = yield* handleSafeParse(res);

    yield* Effect.annotateLogsScoped(parsedUser);
    yield* Effect.log("Successfully parsed");

    const parsedName = yield* validUserName("Jane Doe");
    const updatedUser = changeUserName(parsedUser, parsedName);
    return updatedUser;
  } catch (e) {
    if (e instanceof ZodError) {
      console.log(e.errors);
      return "Recovered from Zod error";
    }
    throw e;
  }
}).pipe(Effect.scoped);

// Run the program
Effect.runPromise(program).then(console.log);
Effect.runPromise(
  programGen.pipe(
    Effect.catchTags({
      ZodError: (zodError) => {
        console.log(zodError.errors);

        return Effect.succeed("Recovered from Zod error");
      },
    })
  )
).then(console.log);
