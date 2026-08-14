import { engine, Material, Transform, PlayerIdentityData } from '@dcl/sdk/ecs'
import { FOGATA_RECALC_INTERVAL_SECONDS } from '../../shared/constants'
import { calculateFogataIntensity } from '../../shared/fogata'
import { FogataMarker } from '../factory/components'

let elapsedSinceRecalc = 0

// Recalcula cada FOGATA_RECALC_INTERVAL_SECONDS, no cada frame (ver límites en
// docs/especificaciones-tecnicas.md sección 1: nunca mandar/recalcular por frame).
export function fogataSystem(dt: number) {
  elapsedSinceRecalc += dt
  if (elapsedSinceRecalc < FOGATA_RECALC_INTERVAL_SECONDS) return
  elapsedSinceRecalc = 0

  const playersPresentes = countPlayersInScene()
  const intensity = calculateFogataIntensity(playersPresentes)

  for (const [fogata] of engine.getEntitiesWith(FogataMarker, Transform)) {
    const transform = Transform.getMutable(fogata)
    transform.scale.x = intensity
    transform.scale.y = intensity
    transform.scale.z = intensity

    const material = Material.getMutableOrNull(fogata)
    if (material?.material?.$case === 'pbr') {
      material.material.pbr.emissiveIntensity = intensity
    }
  }
}

function countPlayersInScene(): number {
  let count = 0
  for (const _ of engine.getEntitiesWith(PlayerIdentityData)) count++
  return count
}
