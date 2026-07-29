import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validations/auth";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: { signIn: "/login" },
  // Lets the app trust the request's Host header when deployed behind a
  // proxy/load balancer (Vercel, Docker behind nginx, etc.) where it can
  // legitimately differ from AUTH_URL. Safe here since we don't derive any
  // security decision from the host itself.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Office email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const email = parsed.data.email.trim().toLowerCase();

          await connectDB();
          const user = await User.findOne({ email, isActive: true }).select("+password");
          if (!user) return null;

          const passwordMatches = await bcrypt.compare(parsed.data.password, user.password);
          if (!passwordMatches) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[auth] authorize failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        delete token.error;
        return token;
      }

      // Re-validate against DB on subsequent requests so deactivated users and
      // role changes take effect immediately instead of waiting for JWT expiry.
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("role isActive name email").lean();

          if (!dbUser || !dbUser.isActive) {
            return { ...token, error: "SessionRevoked" as const, id: "", role: "employee" };
          }

          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          delete token.error;
        } catch (error) {
          console.error("[auth] jwt revalidation failed:", error);
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.error === "SessionRevoked" || !token.id) {
        session.error = "SessionRevoked";
        return session;
      }

      session.user.id = token.id;
      session.user.role = token.role;
      if (token.name) session.user.name = token.name as string;
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },
});
