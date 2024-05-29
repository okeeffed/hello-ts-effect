import { Cause, Effect, Exit, Match } from "effect";
import { NegativeAgeError, IllegalAgeError, program } from "./example";

describe("basic", () => {
  test("example", async () => {
    const res = await Effect.runSync(Effect.succeed("Hello, world!"));

    expect(res).toEqual("Hello, world!");
  });
});

describe("testing errors", () => {
  describe("validate age", () => {
    test.each([
      {
        message: "Negative age is not allowed",
        age: -1,
        error: NegativeAgeError,
      },
      {
        message: "Illegal age is not allowed",
        age: 3,
        error: IllegalAgeError,
      },
      {
        message: "Accepted age is returned",
        age: 18,
      },
    ])("$message", async ({ age, error }) => {
      const res = await Effect.runPromiseExit(program(age));

      Exit.match(res, {
        onSuccess: (value) => {
          expect(value).toEqual(18);
        },
        onFailure: (cause) => {
          const [failure] = Cause.failures(cause);
          expect(failure).toBeInstanceOf(error);
          expect(failure.age).toEqual(age);
        },
      });
    });
  });
});
