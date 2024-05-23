import { Effect, pipe } from "effect";
import * as Http from "@effect/platform/HttpClient";
import { Schedule } from "effect";
import { runMain } from "@effect/platform-node/NodeRuntime";

const getTodo = (id: number) =>
  Http.request
    .get(`https://jsonplaceholder.typicode.com/todos/${id}`)
    .pipe(
      Http.client.fetchOk,
      Http.response.json,
      Effect.timeout("1 seconds"),
      Effect.retry(expBackoff),
      Effect.withSpan("getTodo", { attributes: { id } })
    );

const expBackoff = Schedule.exponential(1000).pipe(
  Schedule.compose(Schedule.recurs(3))
);

const program = Effect.gen(function* () {
  const todo = yield* getTodo(1);
  console.log(todo);

  return todo;
});

const main = pipe(program);

runMain(main);
