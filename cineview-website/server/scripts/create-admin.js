/**
 * Creates the first SUPER_ADMIN.
 *
 *   npm run admin:create
 *
 * Reads ADMIN_INITIAL_NAME / ADMIN_INITIAL_USERNAME / ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD
 * from the environment (or server/.env); anything missing is asked for interactively.
 * Refuses to run when an active SUPER_ADMIN already exists — further admins are created
 * from the dashboard. Nothing runs automatically on server start.
 */
import readline from 'node:readline'
import { loadConfig } from '../src/config/env.js'
import { connectDatabase, disconnectDatabase } from '../src/db/connect.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { createAdmin } from '../src/services/adminUser.service.js'
import { passwordPolicyError } from '../src/services/password.service.js'

const config = loadConfig()
const interactive = process.stdin.isTTY

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  if (hidden) {
    // Echo nothing while the password is typed.
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) rl.output.write(question)
    }
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer.trim())
    }),
  )
}

async function value(envName, label, options = {}) {
  const fromEnv = (process.env[envName] || '').trim()
  if (fromEnv) return fromEnv
  if (!interactive) throw new Error(`${envName} is not set (and no terminal is available to ask for it)`)
  return ask(`${label}: `, options)
}

async function main() {
  await connectDatabase(config.mongoUri)

  if (await AdminUser.exists({ role: 'SUPER_ADMIN', status: 'ACTIVE' })) {
    console.log('An active SUPER_ADMIN already exists. Create additional admins from the dashboard (المستخدمون).')
    return
  }

  console.log('Create the first Cineview SUPER_ADMIN\n')
  const fullName = await value('ADMIN_INITIAL_NAME', 'Full name')
  const username = await value('ADMIN_INITIAL_USERNAME', 'Username (a-z, 0-9, . _ -)')
  const email = await value('ADMIN_INITIAL_EMAIL', 'Email')

  let password = (process.env.ADMIN_INITIAL_PASSWORD || '').trim()
  if (!password) {
    for (;;) {
      password = await value('ADMIN_INITIAL_PASSWORD', 'Password (min 10 chars, letters + numbers)', { hidden: true })
      const policy = passwordPolicyError(password)
      if (policy) {
        console.log(`✗ ${policy}`)
        continue
      }
      if ((await ask('Confirm password: ', { hidden: true })) === password) break
      console.log('✗ Passwords do not match.')
    }
  }

  const admin = await createAdmin(
    { fullName, username, email, password, role: 'SUPER_ADMIN' },
    { bcryptRounds: config.auth.bcryptRounds, via: 'cli' },
  )
  console.log(`\n✓ SUPER_ADMIN created: ${admin.username} <${admin.email}>`)
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    console.log('  Remove ADMIN_INITIAL_PASSWORD from your environment/.env now that the account exists.')
  }
}

main()
  .catch((error) => {
    const details = error.errors ? `\n${Object.values(error.errors).map((e) => `  - ${e}`).join('\n')}` : ''
    console.error(`✗ ${error.message}${details}`)
    process.exitCode = 1
  })
  .finally(() => disconnectDatabase())
