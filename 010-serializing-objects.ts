import { Effect, pipe } from "effect";
import { faker } from "@faker-js/faker";
import { runMain } from "@effect/platform-node/NodeRuntime";

interface RawUser {
  id: string;
  name: string;
  email: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

// Fake an object we need to serialize
const makeUser = (): RawUser => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
});

const users = Array.from({ length: 1000000 }, makeUser).map((user) =>
  JSON.stringify(user)
);

const serializeUser = (deserializedUser: string): User => {
  const rawUser = JSON.parse(deserializedUser);
  return {
    id: rawUser.id,
    fullName: rawUser.name,
    email: rawUser.email,
  };
};

const serializeUserEffect = (deserializedUser: string) =>
  pipe(
    Effect.try(() => JSON.parse(deserializedUser)),
    Effect.map((rawUser) => ({
      id: rawUser.id,
      fullName: rawUser.name,
      email: rawUser.email,
    }))
  );

const program = Effect.forEach(users, serializeUserEffect, {
  concurrency: 1,
});

const program2 = pipe(
  Effect.forEach(users, (userString) =>
    Effect.sync(() => serializeUser(userString))
  )
);

const program3 = () => users.map(serializeUser);

async function main() {
  const start = Date.now();
  await program3();
  console.log(`Time elapsed: ${Date.now() - start}ms`);

  const start2 = Date.now();
  await Effect.runPromise(program);
  console.log(`Effect time elapsed: ${Date.now() - start2}ms`);

  const start3 = Date.now();
  await Effect.runPromise(program2);
  console.log(`Effect alt time elapsed: ${Date.now() - start3}ms`);
}

main();
