import { isServer } from '@dcl/sdk/network'
import { main as clientMain } from './client'
import { main as serverMain } from './server'

// isServer() se resuelve de forma asíncrona apenas arranca el runtime (ver
// node_modules/@dcl/sdk/src/network/index.ts) — en el primer tick puede devolver
// false por defecto mientras se resuelve. No es un problema para lógica de arranque
// como esta, pero no asumir su valor dentro del primer frame en código futuro.
export function main() {
  if (isServer()) {
    serverMain()
  } else {
    clientMain()
  }
}
