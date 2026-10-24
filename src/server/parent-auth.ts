import { authenticated, trustedOrigin } from "./auth";
import { getConfig } from "./config";

export function canAccessParent(request: Request) {
  const config = getConfig();
  return authenticated(request.headers.get("cookie"), config);
}

export function canMutateParent(request: Request) {
  const config = getConfig();
  return trustedOrigin(request.headers.get("origin"), config) && authenticated(request.headers.get("cookie"), config);
}
