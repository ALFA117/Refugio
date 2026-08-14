import { engine, Transform, MeshRenderer, MeshCollider, Material } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { FogataMarker } from './components'

// Placeholder geométrico. Reemplazar por GLTF de fogata cuando exista el asset final
// (agregar Light/partículas del propio GLTF, no como componentes ECS genéricos).
export function createFogataEntity(position: Vector3) {
  const fogata = engine.addEntity()

  Transform.create(fogata, { position, scale: Vector3.create(1, 1, 1) })
  MeshRenderer.setCylinder(fogata)
  MeshCollider.setCylinder(fogata)
  Material.setPbrMaterial(fogata, {
    albedoColor: { r: 0.9, g: 0.3, b: 0.05, a: 1 },
    emissiveColor: { r: 1, g: 0.4, b: 0.05 },
    emissiveIntensity: FOGATA_BASE_EMISSIVE
  })
  FogataMarker.create(fogata)

  return fogata
}

const FOGATA_BASE_EMISSIVE = 1
