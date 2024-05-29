import { Context, Effect, Match, pipe } from "effect";

type Permission = "permission.a" | "permission.b";

interface Role {
  permissions: Permission[];
}

interface ISecurityContext {
  readonly role: Role;
}

class SecurityContextService extends Context.Tag("SecurityContextService")<
  SecurityContextService,
  ISecurityContext
>() {}

class SecurityContext implements ISecurityContext {
  role: Role;

  constructor(role: Role) {
    this.role = role;
  }
}

class PermissionError {
  readonly _tag = "PermissionError";
  readonly name = "PermissionError";
  readonly message = "Permission denied";
}

// Define the set of specific permissions to check
const requiredPermissions = new Set(["permission.a"]);

const match = Match.type<SecurityContext>().pipe(
  Match.when(
    {
      role: (role) =>
        role.permissions.some((permission) =>
          requiredPermissions.has(permission)
        ),
    },
    () => Effect.succeed(true)
  ),
  Match.orElse(() => Effect.fail(PermissionError))
);

const program = Effect.gen(function* () {
  // Acquire instances of the 'Random' and 'Logger' services
  const securityContext = yield* SecurityContextService;

  // Log the random number using the 'Logger' service
  return yield* match(securityContext);
});

const securityContext = new SecurityContext({
  permissions: ["permission.a"],
});
const securityContextB = new SecurityContext({
  permissions: ["permission.b"],
});

// Provide service implementations for 'Random' and 'Logger'
const runnable1 = program.pipe(
  Effect.provideService(SecurityContextService, securityContext)
);

const runnable2 = program.pipe(
  Effect.provideService(SecurityContextService, securityContextB)
);

// Run the program
Effect.runPromise(runnable1).then(console.log).catch(console.error);
Effect.runPromise(runnable2).then(console.log).catch(console.error);
