import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic'; // ← FIX 1: required for Next.js 15

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select('+password');
        if (!user) throw new Error('No account found');
        const valid = await user.comparePassword(credentials.password);
        if (!valid) throw new Error('Incorrect password');
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          level: user.level,
          currentStreak: user.currentStreak,
          totalXP: user.totalXP,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.level = user.level;
        token.currentStreak = user.currentStreak;
        token.totalXP = user.totalXP;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        level: token.level,
        currentStreak: token.currentStreak,
        totalXP: token.totalXP,
      };
      return session;
    },
    // ← FIX 2: this redirects to /dashboard after login
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },

  // ← FIX 3: tells NextAuth where your custom pages are
  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };