import { Console, Data, Effect, pipe } from "effect";

type Result<E, A> = Data.TaggedEnum<{
  Success: { value: A };
  Failure: {
    error: E;
    message?: string;
  };
}>;
interface ResultDefinition extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: Result<this["A"], this["B"]>;
}
const { $is, $match, Failure, Success } = Data.taggedEnum<ResultDefinition>();
const result: Result<string, number> = Success({ value: 5 });

const program = pipe(
  result,
  $match({
    Success: (_) => _.value,
    Failure: (_) => _.error,
  }),
  Console.log
);

Effect.runPromise(program);
