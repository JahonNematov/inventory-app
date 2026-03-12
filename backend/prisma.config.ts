import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    async adapter(env) {
      return new PrismaPg({ connectionString: env.DATABASE_URL })
    },
  },
})
