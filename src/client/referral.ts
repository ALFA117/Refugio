import { getExplorerInformation } from '~system/Runtime'
import { getPlayer } from '@dcl/sdk/players'
import { room } from '../shared/messages'
import { log } from '../shared/log'
import { REFERRAL_URL_PARAM } from '../shared/constants'

// Lee ?ref=<wallet> del link con el que el jugador entró y avisa al servidor.
//
// Fuente: getExplorerInformation().configurations — el mapa de "custom configurations set in
// the explorer" (~system/Runtime), donde aterrizan los parámetros de URL del deep-link del
// explorador. TODO(verificar en preview/producción): confirmar que un link con ?ref=... expone
// la clave aquí; si el explorador usara otra clave, ajustarla. El servidor valida siempre
// (no self-referral, una sola vez), así que un valor basura no hace daño.
export async function initReferral(): Promise<void> {
  try {
    const info = await getExplorerInformation({})
    const ref = info.configurations?.[REFERRAL_URL_PARAM]
    if (!ref) return

    const me = getPlayer()?.userId
    if (me && ref === me) return // no self-referral (chequeo best-effort; el servidor revalida)

    void room.send('registerReferral', { referredBy: ref })
  } catch (e) {
    log.error('referral_read_failed', e)
  }
}
