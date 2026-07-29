import type { Role } from "@/lib/constants/roles";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// NextAuth v5's callback signatures resolve JWT from `@auth/core/jwt` directly
// (`next-auth/jwt` is a pure re-export), so augment the defining module.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
