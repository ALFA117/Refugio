// Otorgamiento y persistencia de brasas — server-only (paso 5, docs/especificaciones-tecnicas.md
// sección 5). Corre exclusivamente en isServer(); usa el Storage nativo del Multiplayer Server:
//   - Storage.player  → balance por wallet, persiste entre sesiones y redeploys
//   - Storage (scene) → leaderboard top N compartido (World Storage)
//
// Anti-cheat real: el cliente nunca pide "dame X brasas"; el servidor decide el monto a partir
// del resultado de la ronda que él mismo arbitró, y sólo él escribe Storage.

import { getPlayer } from '@dcl/sdk/players'
import { Storage, EnvVar } from '@dcl/sdk/server'
import { signedFetch } from '~system/SignedFetch'
import { room } from '../shared/messages'
import {
  BRASAS_FULL_REWARD,
  BRASAS_REDUCED_REWARD,
  LEADERBOARD_SIZE,
  REFERRAL_BONUS
} from '../shared/constants'

type PlayerData = {
  balance: number
  referredBy: string | null // wallet del invitador (paso 6)
  referralBonusClaimed: boolean // el bonus de referido ya se pagó (evita loops/repetición)
  gamesPlayed: number
  version: number
}

// Vínculos invitado→invitador conocidos en esta sesión del servidor. Se hidrata desde
// registerReferral y desde Storage al cargar cada jugador; es la fuente de verdad en memoria
// para no depender de la frescura del cache de lectura de Storage dentro de la sesión.
const referredByMemory = new Map<string, string>()

type LeaderboardEntry = { address: string; displayName: string; brasas: number }

const PLAYER_KEY = 'brasas'
const LEADERBOARD_KEY = 'leaderboard'
const DATA_VERSION = 1

// Otorga brasas a cada participante de la ronda, persiste su balance y refresca el leaderboard.
// Async (respeta el límite de 60s por cadena async); se invoca fire-and-forget desde endRound,
// con manejo de error por jugador para que un fallo puntual no tumbe el resto.
export async function awardBrasasToParticipants(
  participants: string[],
  success: boolean,
  _finalHealth: number
): Promise<void> {
  if (participants.length === 0) return

  const base = success ? BRASAS_FULL_REWARD : BRASAS_REDUCED_REWARD
  const present = new Set(participants)

  // 1. Cargar los datos de todos los participantes (una lectura por jugador).
  const data = new Map<string, PlayerData>()
  const earnedByPlayer = new Map<string, number>()
  for (const address of participants) {
    try {
      const existing = (await Storage.player.get<PlayerData>(address, PLAYER_KEY)) ?? defaultPlayerData()
      hydrateReferralMemory(address, existing.referredBy)
      existing.balance += base
      existing.gamesPlayed += 1
      existing.version = DATA_VERSION
      data.set(address, existing)
      earnedByPlayer.set(address, base)
    } catch (e) {
      console.error('[refugio] error cargando datos de', address, e)
    }
  }

  // 2. Bonus de referido: invitado e invitador completaron ESTA ronda juntos, una sola vez.
  for (const [address, pd] of data) {
    const referrer = pd.referredBy ?? referredByMemory.get(address) ?? null
    if (!referrer || pd.referralBonusClaimed) continue
    if (!present.has(referrer)) continue // el invitador también debe haber participado
    const referrerData = data.get(referrer)
    if (!referrerData) continue

    pd.balance += REFERRAL_BONUS
    pd.referralBonusClaimed = true
    referrerData.balance += REFERRAL_BONUS
    earnedByPlayer.set(address, (earnedByPlayer.get(address) ?? base) + REFERRAL_BONUS)
    earnedByPlayer.set(referrer, (earnedByPlayer.get(referrer) ?? base) + REFERRAL_BONUS)
  }

  // 3. Persistir y notificar a cada jugador su nuevo balance.
  const updated: LeaderboardEntry[] = []
  for (const [address, pd] of data) {
    try {
      await Storage.player.set(address, PLAYER_KEY, pd)
      updated.push({ address, displayName: resolveName(address), brasas: pd.balance })
      void room.send(
        'brasasAwarded',
        { balance: pd.balance, earned: earnedByPlayer.get(address) ?? base },
        { to: [address] }
      )
    } catch (e) {
      console.error('[refugio] error otorgando brasas a', address, e)
    }
  }

  await updateLeaderboard(updated)
}

// Registra el vínculo invitado→invitador (mensaje registerReferral). Idempotente: una sola
// vez por jugador, nunca self-referral. Persiste referredBy sin tocar el balance.
export async function registerReferral(newPlayer: string, referrer: string): Promise<void> {
  if (!referrer || referrer === newPlayer) return // no self-referral
  if (referredByMemory.has(newPlayer)) return // ya vinculado en esta sesión

  try {
    const existing = (await Storage.player.get<PlayerData>(newPlayer, PLAYER_KEY)) ?? defaultPlayerData()
    if (existing.referredBy) {
      referredByMemory.set(newPlayer, existing.referredBy) // ya tenía invitador, respetarlo
      return
    }
    existing.referredBy = referrer
    existing.version = DATA_VERSION
    await Storage.player.set(newPlayer, PLAYER_KEY, existing)
    referredByMemory.set(newPlayer, referrer)
  } catch (e) {
    console.error('[refugio] error registrando referido', newPlayer, referrer, e)
  }
}

function hydrateReferralMemory(address: string, referredBy: string | null) {
  if (referredBy && !referredByMemory.has(address)) referredByMemory.set(address, referredBy)
}

// Fusiona los balances recién actualizados con el leaderboard guardado y persiste el top N.
async function updateLeaderboard(updated: LeaderboardEntry[]): Promise<void> {
  if (updated.length === 0) return
  try {
    const current = (await Storage.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? []
    const byAddress = new Map<string, LeaderboardEntry>()
    for (const entry of current) byAddress.set(entry.address, entry)
    for (const entry of updated) byAddress.set(entry.address, entry) // el balance fresco gana

    const top = [...byAddress.values()].sort((a, b) => b.brasas - a.brasas).slice(0, LEADERBOARD_SIZE)
    await Storage.set(LEADERBOARD_KEY, top)

    // Broadcast a todos para mostrarlo in-world (sin address, sólo nombre visible + brasas).
    void room.send('leaderboardUpdated', {
      entries: top.map((e) => ({ displayName: e.displayName, brasas: e.brasas }))
    })

    // Empuja el snapshot al sitio companion (Wall of Guardians) para el leaderboard público
    // fuera de Decentraland. Fire-and-forget; sólo actúa si hay EnvVars configuradas.
    void pushToCompanion(top)
  } catch (e) {
    console.error('[refugio] error actualizando leaderboard', e)
  }
}

// signedFetch POST del top al API del companion. Requiere dos EnvVars en el deploy DCL:
//   COMPANION_URL     → https://refugio-azure.vercel.app/api/leaderboard
//   COMPANION_SECRET  → mismo valor que REFUGIO_INGEST_SECRET en Vercel
// Sin ellas no hace nada (el sitio sigue mostrando datos de muestra).
async function pushToCompanion(top: LeaderboardEntry[]): Promise<void> {
  try {
    const url = await EnvVar.get('COMPANION_URL')
    const secret = await EnvVar.get('COMPANION_SECRET')
    if (!url || !secret) return

    await signedFetch({
      url,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-refugio-secret': secret },
        body: JSON.stringify({
          entries: top.map((e) => ({ displayName: e.displayName, brasas: e.brasas }))
        })
      }
    })
  } catch (e) {
    console.error('[refugio] error empujando snapshot al companion', e)
  }
}

// Nombre para el leaderboard. En el servidor puede no haber perfil resuelto → address corta.
function resolveName(address: string): string {
  const player = getPlayer({ userId: address })
  if (player?.name) return player.name
  return shortenAddress(address)
}

function shortenAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

function defaultPlayerData(): PlayerData {
  return { balance: 0, referredBy: null, referralBonusClaimed: false, gamesPlayed: 0, version: DATA_VERSION }
}
