import { Effect, Context, Exit, Layer } from "effect";
import {
  make,
  ConcreteS3,
  S3Error,
  S3,
  ElasticSearch,
  ElasticSearchError,
} from "./017-layer-override";

/**
 * TEST CASES
 */
// The `FailureCaseLiterals` type allows us to provide different error scenarios while testing our services.
// For example, by providing the value "S3", we can simulate an error scenario specific to the S3 service.
// This helps us ensure that our program handles errors correctly and behaves as expected in various situations.
// Similarly, we can provide other values like "ElasticSearch" or "Database" to simulate error scenarios for those services.
// In cases where we want to test the absence of errors, we can provide `undefined`.
// By using this parameter, we can thoroughly test our services and verify their behavior under different error conditions.
type FailureCaseLiterals = "S3" | "ElasticSearch" | undefined;
class FailureCase extends Context.Tag("FailureCase")<
  FailureCase,
  FailureCaseLiterals
>() {}

const s3Layer = Layer.succeed(S3, new ConcreteS3());
const elasticSearchLayer = Layer.succeed(ElasticSearch, {
  createIndex: Effect.gen(function* () {
    console.log("Creating index");
    return { id: "<index.id>" };
  }),
  deleteIndex: (index) =>
    Effect.sync(() => console.log(`Deleting index ${index.id}`)),
});

describe("017-layer-override", () => {
  test("expect successful creation", async () => {
    // Merge all the test layers for S3, ElasticSearch, and Database services into a single layer
    const layer = Layer.mergeAll(s3Layer, elasticSearchLayer);

    const runnable = make.pipe(
      Effect.provide(layer),
      Effect.provideService(FailureCase, undefined)
    );

    const res = await Effect.runPromise(runnable);
    expect(res).toEqual({
      bucket: { name: "<bucket.name>" },
      index: { id: "<index.id>" },
    });
  });

  test("expect no bucket to be created if S3 fails", async () => {
    const s3FailLayer = Layer.effect(
      S3,
      Effect.gen(function* () {
        const failureCase = yield* FailureCase;

        const s3 = new ConcreteS3();

        return {
          createBucket: Effect.gen(function* () {
            if (failureCase === "S3") {
              return yield* Effect.fail(new S3Error());
            } else {
              return yield* s3.createBucket;
            }
          }),
          deleteBucket: (bucket) => s3.deleteBucket(bucket),
        };
      })
    );

    // Merge all the test layers for S3, ElasticSearch, and Database services into a single layer
    const layer = Layer.mergeAll(s3FailLayer, elasticSearchLayer);

    const runnable = make.pipe(
      Effect.provide(layer),
      Effect.provideService(FailureCase, "S3")
    );

    const res = await Effect.runPromiseExit(runnable);
    expect(Exit.isFailure(res)).toBe(true);
    Effect.match(res, {
      onFailure: (cause) => {
        expect(cause).toBeInstanceOf(S3Error);
      },
      onSuccess: () => {
        throw new Error("Expected failure");
      },
    });
  });

  test("expect s3 bucket to be destroyed when index fails to create", async () => {
    const elasticSearchFailLayer = Layer.effect(
      ElasticSearch,
      Effect.gen(function* () {
        const failureCase = yield* FailureCase;

        return {
          createIndex: Effect.gen(function* () {
            console.log("Attempting to create index");

            if (failureCase === "ElasticSearch") {
              console.log("Failed to create index");
              return yield* Effect.fail(new ElasticSearchError());
            } else {
              return { id: "<index.id>" };
            }
          }),
          deleteIndex: (index) =>
            Effect.sync(() => console.log(`Deleting index ${index.id}`)),
        };
      })
    );

    // Merge all the test layers for S3, ElasticSearch, and Database services into a single layer
    const layer = Layer.mergeAll(s3Layer, elasticSearchFailLayer);

    const runnable = make.pipe(
      Effect.provide(layer),
      Effect.provideService(FailureCase, "ElasticSearch")
    );

    const res = await Effect.runPromiseExit(runnable);
    expect(Exit.isFailure(res)).toBe(true);
    Effect.match(res, {
      onFailure: (cause) => {
        expect(cause).toBeInstanceOf(ElasticSearchError);
      },
      onSuccess: () => {
        throw new Error("Expected failure");
      },
    });
  });

  // test.each([
  //   {
  //     case: "expect successful creation",
  //     failureCase: undefined,
  //     expectedError: undefined,
  //     expectedSuccess: {
  //       bucket: { name: "<bucket.name>" },
  //       index: { id: "<index.id>" },
  //     },
  //     s3Layer: Layer.succeed(S3, new ConcreteS3()),
  //     elasticSearchLayer: Layer.succeed(ElasticSearch, {
  //       createIndex: Effect.sync(() => ({ id: "<index.id>" })),
  //       deleteIndex: (index) =>
  //         Effect.sync(() => console.log(`Deleting index ${index.id}`)),
  //     }),
  //   },
  //   {
  //     case: "expect no bucket to be created if S3 fails",
  //     failureCase: "S3" as const,
  //     expectedError: S3Error,
  //     expectedSuccess: undefined,
  //     s3Layer: Layer.effect(
  //       S3,
  //       Effect.gen(function* () {
  //         const failureCase = yield* FailureCase;

  //         const s3 = new ConcreteS3();

  //         return {
  //           createBucket: Effect.gen(function* () {
  //             if (failureCase === "S3") {
  //               return yield* Effect.fail(new S3Error());
  //             } else {
  //               return yield* s3.createBucket;
  //             }
  //           }),
  //           deleteBucket: (bucket) => s3.deleteBucket(bucket),
  //         };
  //       })
  //     ),
  //     elasticSearchLayer: Layer.succeed(ElasticSearch, {
  //       createIndex: Effect.sync(() => ({ id: "<index.id>" })),
  //       deleteIndex: (index) =>
  //         Effect.sync(() => console.log(`Deleting index ${index.id}`)),
  //     }),
  //   },
  //   {
  //     case: "expect s3 bucket to be destroyed when index fails to create",
  //     failureCase: "S3" as const,
  //     expectedError: S3Error,
  //     expectedSuccess: undefined,
  //     s3Layer: Layer.succeed(S3, new ConcreteS3()),
  //     elasticSearchLayer: Layer.effect(
  //       ElasticSearch,
  //       Effect.gen(function* () {
  //         const failureCase = yield* FailureCase;

  //         return {
  //           createIndex: Effect.gen(function* () {
  //             if (failureCase === "ElasticSearch") {
  //               return yield* Effect.fail(new ElasticSearchError());
  //             } else {
  //               return { id: "<index.id>" };
  //             }
  //           }),
  //           deleteIndex: (index) =>
  //             Effect.sync(() => console.log(`Deleting index ${index.id}`)),
  //         };
  //       })
  //     ),
  //   },
  // ])(
  //   "$case",
  //   async ({
  //     s3Layer,
  //     elasticSearchLayer,
  //     failureCase,
  //     expectedError,
  //     expectedSuccess,
  //   }) => {
  //     // Merge all the test layers for S3, ElasticSearch, and Database services into a single layer
  //     const layer = Layer.mergeAll(s3Layer, elasticSearchLayer);

  //     const runnable = make.pipe(
  //       Effect.provide(layer),
  //       Effect.provideService(FailureCase, failureCase)
  //     );

  //     const res = await Effect.runPromiseExit(runnable);

  //     Exit.match(res, {
  //       onSuccess: (value) => {
  //         expect(value).toEqual(expectedSuccess);
  //       },
  //       onFailure: (cause) => {
  //         const [failure] = Cause.failures(cause);
  //         expect(failure).toBeInstanceOf(expectedError);
  //       },
  //     });
  //   }
  // );
});
