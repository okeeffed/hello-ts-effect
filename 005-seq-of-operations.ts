import { Effect, Context, Exit, Layer, Console } from "effect";
export class S3Error {
  readonly _tag = "S3Error";
}
export interface Bucket {
  readonly name: string;
}
export class S3 extends Context.Tag("S3")<
  S3,
  {
    readonly createBucket: Effect.Effect<Bucket, S3Error>;
    readonly deleteBucket: (bucket: Bucket) => Effect.Effect<void>;
  }
>() {}
export class ElasticSearchError {
  readonly _tag = "ElasticSearchError";
}
export interface Index {
  readonly id: string;
}
export class ElasticSearch extends Context.Tag("ElasticSearch")<
  ElasticSearch,
  {
    readonly createIndex: Effect.Effect<Index, ElasticSearchError>;
    readonly deleteIndex: (index: Index) => Effect.Effect<void>;
  }
>() {}
export class DatabaseError {
  readonly _tag = "DatabaseError";
}
export interface Entry {
  readonly id: string;
}
export class Database extends Context.Tag("Database")<
  Database,
  {
    readonly createEntry: (
      bucket: Bucket,
      index: Index
    ) => Effect.Effect<Entry, DatabaseError>;
    readonly deleteEntry: (entry: Entry) => Effect.Effect<void>;
  }
>() {}

/**
 * Creating the services
 */
// Create a bucket, and define the release function that deletes the bucket if the operation fails.
const createBucket = Effect.gen(function* () {
  const { createBucket, deleteBucket } = yield* S3;
  return yield* Effect.acquireRelease(createBucket, (bucket, exit) =>
    // The release function for the Effect.acquireRelease operation is responsible for handling the acquired resource (bucket) after the main effect has completed.
    // It is called regardless of whether the main effect succeeded or failed.
    // If the main effect failed, Exit.isFailure(exit) will be true, and the function will perform a rollback by calling deleteBucket(bucket).
    // If the main effect succeeded, Exit.isFailure(exit) will be false, and the function will return Effect.void, representing a successful, but do-nothing effect.
    Exit.isFailure(exit) ? deleteBucket(bucket) : Effect.void
  );
});

// Create an index, and define the release function that deletes the index if the operation fails.
const createIndex = Effect.gen(function* () {
  const { createIndex, deleteIndex } = yield* ElasticSearch;
  return yield* Effect.acquireRelease(createIndex, (index, exit) =>
    Exit.isFailure(exit) ? deleteIndex(index) : Effect.void
  );
});

// Create an entry in the database, and define the release function that deletes the entry if the operation fails.
const createEntry = (bucket: Bucket, index: Index) =>
  Effect.gen(function* () {
    const { createEntry, deleteEntry } = yield* Database;
    return yield* Effect.acquireRelease(
      createEntry(bucket, index),
      (entry, exit) => (Exit.isFailure(exit) ? deleteEntry(entry) : Effect.void)
    );
  });

export const make = Effect.scoped(
  Effect.gen(function* () {
    const bucket = yield* createBucket;
    const index = yield* createIndex;
    return yield* createEntry(bucket, index);
  })
);

/**
 * TEST CASES
 */
// The `FailureCaseLiterals` type allows us to provide different error scenarios while testing our services.
// For example, by providing the value "S3", we can simulate an error scenario specific to the S3 service.
// This helps us ensure that our program handles errors correctly and behaves as expected in various situations.
// Similarly, we can provide other values like "ElasticSearch" or "Database" to simulate error scenarios for those services.
// In cases where we want to test the absence of errors, we can provide `undefined`.
// By using this parameter, we can thoroughly test our services and verify their behavior under different error conditions.
type FailureCaseLiterals = "S3" | "ElasticSearch" | "Database" | undefined;
class FailureCase extends Context.Tag("FailureCase")<
  FailureCase,
  FailureCaseLiterals
>() {}

// Create a test layer for the S3 service
const S3Test = Layer.effect(
  S3,
  Effect.gen(function* () {
    const failureCase = yield* FailureCase;
    return {
      createBucket: Effect.gen(function* () {
        console.log("[S3] creating bucket");
        if (failureCase === "S3") {
          return yield* Effect.fail(new S3Error());
        } else {
          return { name: "<bucket.name>" };
        }
      }),
      deleteBucket: (bucket) =>
        Console.log(`[S3] delete bucket ${bucket.name}`),
    };
  })
);

// Create a test layer for the ElasticSearch service
const ElasticSearchTest = Layer.effect(
  ElasticSearch,
  Effect.gen(function* () {
    const failureCase = yield* FailureCase;
    return {
      createIndex: Effect.gen(function* () {
        console.log("[ElasticSearch] creating index");
        if (failureCase === "ElasticSearch") {
          return yield* Effect.fail(new ElasticSearchError());
        } else {
          return { id: "<index.id>" };
        }
      }),
      deleteIndex: (index) =>
        Console.log(`[ElasticSearch] delete index ${index.id}`),
    };
  })
);
// Create a test layer for the Database service
const DatabaseTest = Layer.effect(
  Database,
  Effect.gen(function* () {
    const failureCase = yield* FailureCase;
    return {
      createEntry: (bucket, index) =>
        Effect.gen(function* () {
          console.log(
            `[Database] creating entry for bucket ${bucket.name} and index ${index.id}`
          );
          if (failureCase === "Database") {
            return yield* Effect.fail(new DatabaseError());
          } else {
            return { id: "<entry.id>" };
          }
        }),
      deleteEntry: (entry) =>
        Console.log(`[Database] delete entry ${entry.id}`),
    };
  })
);
// Merge all the test layers for S3, ElasticSearch, and Database services into a single layer
const layer = Layer.mergeAll(S3Test, ElasticSearchTest, DatabaseTest);
// Create a runnable effect to test the Workspace code
// The effect is provided with the test layer and a FailureCase service with undefined value (no failure case)
// SUCCESS CASE
// const runnable = make.pipe(
//   Effect.provide(layer),
//   Effect.provideService(FailureCase, undefined)
// );

// FAIL CASE
const runnable = make.pipe(
  Effect.provide(layer),
  Effect.provideService(FailureCase, "Database")
);

Effect.runPromise(Effect.either(runnable)).then(console.log);
