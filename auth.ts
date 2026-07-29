import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Query casters aren't guaranteed to apply the schema's `lowercase`
        // option to filter values, so normalize explicitly rather than rely
        // on it for a security-relevant lookup.
        const email = parsed.data.email.trim().toLowerCase();

        await connectDB();
        const user = await User.findOne({ email, isActive: true }).select("+password");
        // Same "no such user" vs "wrong password" response either way, so a
        // failed login never reveals which part was wrong.
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.password);
        if (!passwordMatches) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
