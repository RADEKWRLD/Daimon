export class SandboxViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxViolationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function assertSameUser(viewerUserId: string, targetUserId: string) {
  if (viewerUserId !== targetUserId) {
    throw new SandboxViolationError("Cross-user access is not allowed.");
  }
}
