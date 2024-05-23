import { Effect, Duration, Console, pipe } from "effect";

// A sample effect that simulates a long-running operation
const longRunningEffect = Effect.sleep(Duration.seconds(5)).pipe(
  Effect.flatMap(() => Effect.succeed("Operation completed"))
);

// Applying timeout to the effect
const timedEffect = pipe(
  longRunningEffect,
  Effect.timeout(Duration.seconds(3)) // Setting a timeout of 3 seconds
);

const program = pipe(
  timedEffect,
  Effect.tap((result) => Console.log(`Result: ${result}`)),
  Effect.catchAll((error) => Console.log(`Error: ${error}`))
);

Effect.runPromise(program).then(console.log).catch(console.error);
