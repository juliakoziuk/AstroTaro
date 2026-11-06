// Запускає фронтенд і бекенд разом; рядки виводу підписані [frontend] / [backend].
// Ctrl+C зупиняє обидва.
import { spawn } from 'node:child_process'

const procs = [
  { name: 'frontend', cmd: 'npm run run:frontend' },
  { name: 'backend', cmd: 'npm run run:backend' },
]

const children = procs.map(({ name, cmd }) => {
  const child = spawn(cmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const tag = (chunk) =>
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => console.log(`[${name}] ${line}`))
  child.stdout.on('data', tag)
  child.stderr.on('data', tag)
  child.on('exit', (code) => console.log(`[${name}] зупинено (код ${code})`))
  return child
})

const stop = () => children.forEach((c) => c.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
