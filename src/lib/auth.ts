import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { type DefaultSession, getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET deve estar definido em produção.");
}

const credentialsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        username: { label: "Utilizador", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
        });

        if (!user || !user.active) {
          return null;
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          active: user.active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
        token.active = user.active;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        name: token.name,
        username: token.username,
        role: token.role,
        active: token.active,
      } as DefaultSession["user"] & {
        id: string;
        username: string;
        role: Role;
        active: boolean;
      };

      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export function getDashboardPath(role: Role) {
  return role === Role.COMMANDER ? "/comando" : "/tripulante";
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.active) {
    redirect("/");
  }

  return session.user;
}

export async function requireCommander() {
  const user = await requireUser();

  if (user.role !== Role.COMMANDER) {
    redirect("/tripulante");
  }

  return user;
}

export async function requireCrewMember() {
  const user = await requireUser();

  if (user.role !== Role.CREW_MEMBER) {
    redirect("/comando");
  }

  return user;
}