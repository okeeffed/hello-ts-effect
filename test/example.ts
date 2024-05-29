import { Effect } from "effect";

export class NegativeAgeError {
  readonly _tag = "NegativeAgeError";
  constructor(readonly age: number) {}
}

export class IllegalAgeError {
  readonly _tag = "IllegalAgeError";
  constructor(readonly age: number) {}
}

export const program = (
  age: number
): Effect.Effect<number, NegativeAgeError | IllegalAgeError> => {
  if (age < 0) {
    return Effect.fail(new NegativeAgeError(age));
  } else if (age < 18) {
    return Effect.fail(new IllegalAgeError(age));
  } else {
    return Effect.succeed(age);
  }
};
