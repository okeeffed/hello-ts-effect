import { Effect, Context, pipe } from "effect";
import * as z from "zod";

// 1. Declare the effect
const isString = (input: unknown) => {
  return z.string().safeParse(input);
};

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
  Effect.succeed(2),
  Effect.andThen(isString),
  Effect.andThen(handleSafeParse),
  Effect.tap(console.log),
  Effect.andThen(reverseString),
  Effect.catchTags({
    ZodError: (zodError) => {
      console.log(zodError.errors);

      return Effect.succeed("Recovered from Zod error");
    },
  })
);

const programGen = Effect.gen(function* () {
  const initial = yield* Effect.succeed(2);
  const initialIsString = isString(initial);
  const parsedValue = yield* handleSafeParse(initialIsString);
  console.log(parsedValue);

  const reversedValue = reverseString(parsedValue);
  return reversedValue;
});

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
