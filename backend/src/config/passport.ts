import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy } from 'passport-github2'
import prisma from '../prisma'

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isAdmin: true,
        isBlocked: true,
      },
    })
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

// ─── Google Strategy ─────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(new Error('No email from Google'))

        const account = await prisma.account.findUnique({
          where: { provider_providerId: { provider: 'google', providerId: profile.id } },
          include: { user: true },
        })

        if (account) {
          if (account.user.isBlocked) return done(null, false as any)
          return done(null, account.user)
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            accounts: {
              create: { provider: 'google', providerId: profile.id },
            },
          },
          create: {
            email,
            name: profile.displayName || email.split('@')[0],
            avatar: profile.photos?.[0]?.value,
            accounts: {
              create: { provider: 'google', providerId: profile.id },
            },
          },
        })

        return done(null, user)
      } catch (err) {
        return done(err as Error)
      }
    }
  )
)

// ─── GitHub Strategy ─────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(new Error('No email from GitHub'))

        const account = await prisma.account.findUnique({
          where: {
            provider_providerId: { provider: 'github', providerId: String(profile.id) },
          },
          include: { user: true },
        })

        if (account) {
          if (account.user.isBlocked) return done(null, false)
          return done(null, account.user)
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            accounts: {
              create: { provider: 'github', providerId: String(profile.id) },
            },
          },
          create: {
            email,
            name: profile.displayName || profile.username || email.split('@')[0],
            avatar: profile.photos?.[0]?.value,
            accounts: {
              create: { provider: 'github', providerId: String(profile.id) },
            },
          },
        })

        return done(null, user)
      } catch (err) {
        return done(err as Error)
      }
    }
  )
)

export default passport
