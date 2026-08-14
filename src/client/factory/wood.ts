import { engine, Entity, Transform, MeshRenderer, MeshCollider, Material, InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { room } from '../../shared/messages'
import { WOOD_Y } from '../../shared/constants'

// Entidades de leña locales de cada cliente, indexadas por el id que asigna el servidor.
// No se sincronizan por syncEntity: el servidor las orquesta por mensajes (woodSpawned/
// woodResolved), cada cliente materializa/destruye su propia copia.
const woodEntities = new Map<number, Entity>()

export function spawnWoodVisual(id: number, x: number, z: number) {
  // Evitar duplicados si llega el mensaje dos veces.
  if (woodEntities.has(id)) return

  const wood = engine.addEntity()
  Transform.create(wood, {
    position: Vector3.create(x, WOOD_Y, z),
    scale: Vector3.create(0.35, 0.35, 0.35)
  })
  MeshRenderer.setBox(wood)
  MeshCollider.setBox(wood)
  Material.setPbrMaterial(wood, {
    albedoColor: { r: 0.45, g: 0.28, b: 0.12, a: 1 },
    emissiveColor: { r: 0.5, g: 0.25, b: 0.05 },
    emissiveIntensity: 0.4
  })

  // Tap → pedir al servidor alimentar el fuego con esta leña. El servidor valida y decide.
  pointerEventsSystem.onPointerDown(
    { entity: wood, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Alimentar el fuego' } },
    () => {
      void room.send('feedFire', { woodId: id })
    }
  )

  woodEntities.set(id, wood)
}

// El servidor resolvió la leña (alimentada o expirada) → quitar la copia local.
export function removeWoodVisual(id: number) {
  const wood = woodEntities.get(id)
  if (wood === undefined) return
  engine.removeEntity(wood)
  woodEntities.delete(id)
}

// Limpieza al cerrar/empezar ronda: retira toda la leña pendiente.
export function clearAllWood() {
  for (const [id, wood] of woodEntities) {
    engine.removeEntity(wood)
    woodEntities.delete(id)
  }
}
