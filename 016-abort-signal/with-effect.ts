import { Console, Effect } from "effect";
import * as Http from "@effect/platform/HttpClient";

const main = Http.request.get("http://localhost:3000/delayed").pipe(
  Http.client.fetchOk,
  Http.response.json,
  Effect.andThen((data) => Console.log(data)),
  Effect.scoped
);

Effect.runPromise(main);
