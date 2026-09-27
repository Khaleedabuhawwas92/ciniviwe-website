// Minimal structured logger. Never pass secrets or full request bodies to it.
const silent = process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS

const write = (level, message, meta) => {
  if (silent) return
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta })
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
}
