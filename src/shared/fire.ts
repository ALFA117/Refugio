import { engine, Entity, Schemas, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { syncEntity } from '@dcl/sdk/network'

// Salud del fuego durante el minijuego. SÓLO el servidor la escribe; los clientes la
// leen para el visual de la llama. Sincronizada vía syncEntity con un enum id estático
// para que la misma entidad de red se resuelva en servidor y en todos los clientes.
export const FireHealth = engine.defineComponent('refugio::fire-health', {
  value: Schemas.Int, // 0-100
  roundActive: Schemas.Boolean
})

const FIRE_ENUM_ID = 2000
let fireEntity: Entity | undefined

// Idempotente: crea la entidad de fuego una sola vez por runtime (servidor o cliente).
// Ambas ramas deben llamarla con el mismo enum id para que el estado sincronice.
export function ensureFireEntity(center: Vector3): Entity {
  if (fireEntity !== undefined) return fireEntity

  const e = engine.addEntity()
  Transform.create(e, { position: Vector3.create(center.x, center.y, center.z) })
  FireHealth.create(e, { value: 0, roundActive: false })
  syncEntity(e, [FireHealth.componentId], FIRE_ENUM_ID)

  fireEntity = e
  return e
}

export function getFireEntity(): Entity | undefined {
  return fireEntity
}
