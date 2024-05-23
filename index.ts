import { Effect } from "effect";

const increment = (x: number) => x + 1;
const divide = (a: number, b: number): Effect.Effect<number, Error> =>
  b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b);

const addToDynamo: Promise<number> = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject();
    resolve(10);
  }, 1000);
});

const addToPostgres: Promise<number> = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject();
    resolve(2);
  }, 1000);
});

const task1 = Effect.tryPromise({
  try: () => addToDynamo,
  catch: () => new Error("Dynamo failed"),
});
const task2 = Effect.tryPromise({
  try: () => addToPostgres,
  catch: () => new Error("Postgres failed"),
});

export const program = Effect.gen(function* () {
  const start = Date.now();
  const [errors, results] = yield* Effect.partition([task1, task2], (x) => x);

  if (errors.length > 0) {
    const end = Date.now();
    console.log(errors);
    return `Time taken: ${end - start}. Errors: ${errors}`;
  } else {
    const n1 = yield* divide(results[0], results[1]);
    const n2 = increment(n1);
    const end = Date.now();
    return `Time taken: ${end - start}. Answer: ${n2}`;
  }
});

console.log("Starting program...");
Effect.runPromise(program).then(console.log, console.error); // Output: "Result is: 6"
