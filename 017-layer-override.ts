import { Context, Effect, Exit } from "effect";
export class S3Error {
  readonly _tag = "S3Error";
}

interface Bucket {
  readonly name: string;
}

export interface IS3 {
  readonly createBucket: Effect.Effect<Bucket, S3Error>;
  readonly deleteBucket: (bucket: Bucket) => Effect.Effect<void>;
}

export class S3 extends Context.Tag("S3")<
  IS3,
  {
    readonly createBucket: Effect.Effect<Bucket, S3Error>;
    readonly deleteBucket: (bucket: Bucket) => Effect.Effect<void>;
  }
>() {}

export class ConcreteS3 implements IS3 {
  readonly createBucket = Effect.gen(function* () {
    console.log("Creating bucket");
    return { name: "<bucket.name>" };
  });

  readonly deleteBucket = (bucket: Bucket) =>
    Effect.gen(function* () {
      console.log(`Deleting bucket ${bucket.name}`);
      return;
    });
}

// ElasticSearch
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

export const make = Effect.scoped(
  Effect.gen(function* () {
    const bucket = yield* createBucket;
    const index = yield* createIndex;

    return {
      bucket,
      index,
    };
  })
);
