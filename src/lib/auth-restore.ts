export function restoreFailureAction(error: unknown) {
  return error && typeof error === "object" && "status" in error && error.status === 401
    ? "sign-out"
    : "retry";
}
