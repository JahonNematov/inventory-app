declare module 'passport-github2' {
  import { Strategy as PassportStrategy } from 'passport'

  interface Profile {
    id: string
    displayName: string
    username: string
    emails?: Array<{ value: string }>
    photos?: Array<{ value: string }>
  }

  type VerifyCallback = (err: any, user?: any, info?: any) => void

  interface StrategyOptions {
    clientID: string
    clientSecret: string
    callbackURL: string
    scope?: string[]
  }

  class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => void
    )
    name: string
    authenticate(req: any, options?: any): void
  }
}
