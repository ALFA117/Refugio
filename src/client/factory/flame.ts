import { engine, Entity, Transform, MeshRenderer, Material } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

// Llama del minijuego: un cono sobre la fogata cuyo tamaño/brillo refleja FireHealth.
// Es visual local del cliente (no se sincroniza): el estado autoritativo viaja en
// FireHealth; cada cliente lo traduce a este visual. Oculta (escala 0) fuera de ronda.
let flame: Entity | undefined

export function createFlame(center: Vector3): Entity {
  if (flame !== undefined) return flame

  const e = engine.addEntity()
  Transform.create(e, {
    position: Vector3.create(center.x, center.y + 0.9, center.z),
    scale: Vector3.create(0, 0, 0)
  })
  // Cono = cilindro con radio superior 0.
  MeshRenderer.setCylinder(e, 0, 0.5)
  Material.setPbrMaterial(e, {
    albedoColor: { r: 1, g: 0.5, b: 0.1, a: 1 },
    emissiveColor: { r: 1, g: 0.5, b: 0.1 },
    emissiveIntensity: 1
  })

  flame = e
  return e
}

export function getFlame(): Entity | undefined {
  return flame
}
