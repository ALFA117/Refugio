import ReactEcs, { Label, Button, UiEntity, ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { getBrasasBalance, getFireState, getLeaderboard, isServerReady } from '../systems/minigame'
import {
  isOnboardingActive,
  currentScreen,
  currentStep,
  screenCount,
  advanceOnboarding,
  skipOnboarding
} from './onboardingState'
import { getDisplayedHealth, getBannerAlpha, getOnboardingReveal } from './uiAnim'
import { FIRE_MAX_HEALTH } from '../../shared/constants'

// Registra la UI de react-ecs. Se re-renderiza cada tick leyendo el estado actual + animación.
export function setupUi() {
  ReactEcsRenderer.setUiRenderer(RefugioUi)
}

const RefugioUi = () => (
  <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
    <Hud />
    {isOnboardingActive() && <Onboarding />}
  </UiEntity>
)

// --- HUD -------------------------------------------------------------------

const Hud = () => {
  const brasas = getBrasasBalance()
  const fire = getFireState()
  const leaderboard = getLeaderboard()
  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
      <BrasasPill brasas={brasas} />
      {fire.roundActive && <FireBar />}
      {leaderboard.length > 0 && <Leaderboard entries={leaderboard} />}
      {!isServerReady() && <ConnectingBanner />}
    </UiEntity>
  )
}

const BrasasPill = ({ brasas }: { brasas: number }) => (
  <UiEntity
    uiTransform={{
      positionType: 'absolute',
      position: { top: 20, left: 20 },
      alignItems: 'center',
      padding: { top: 10, bottom: 10, left: 16, right: 18 }
    }}
    uiBackground={{ color: PANEL_BG }}
  >
    <Label value="🔥" fontSize={18} />
    <Label
      value={`${brasas < 0 ? 0 : brasas}`}
      fontSize={20}
      font="monospace"
      color={EMBER}
      uiTransform={{ margin: { left: 8, right: 6 } }}
    />
    <Label value="brasas" fontSize={13} color={MUTED} />
  </UiEntity>
)

const FireBar = () => {
  const value = getDisplayedHealth() // suavizado por uiAnimSystem
  const pct = Math.max(0, Math.min(100, Math.round((value / FIRE_MAX_HEALTH) * 100)))
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 20, right: 20 },
        width: 240,
        flexDirection: 'column',
        padding: { top: 10, bottom: 12, left: 14, right: 14 }
      }}
      uiBackground={{ color: PANEL_BG }}
    >
      <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label value="SALUD DEL FUEGO" fontSize={11} color={VIOLET} textAlign="middle-left" />
        <Label value={`${pct}%`} fontSize={14} font="monospace" color={healthColor(pct)} textAlign="middle-right" />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 10, margin: { top: 8 } }} uiBackground={{ color: BAR_TRACK }}>
        <UiEntity uiTransform={{ width: `${pct}%`, height: '100%' }} uiBackground={{ color: healthColor(pct) }} />
      </UiEntity>
    </UiEntity>
  )
}

// Estado de carga mientras el Multiplayer Server despierta (~15s). Respira (alpha animada).
const ConnectingBanner = () => (
  <UiEntity
    uiTransform={{
      positionType: 'absolute',
      position: { top: 78, left: '50%' },
      margin: { left: -130 },
      width: 260,
      height: 42,
      justifyContent: 'center',
      alignItems: 'center'
    }}
    uiBackground={{ color: withAlpha(PANEL_BG, 0.6 + getBannerAlpha() * 0.35) }}
  >
    <Label value="🔥 Encendiendo la fogata…" fontSize={14} color={withAlpha(EMBER, getBannerAlpha())} />
  </UiEntity>
)

// Panel de leaderboard in-world (top 5). Refleja el World Storage persistente.
const Leaderboard = ({ entries }: { entries: { displayName: string; brasas: number }[] }) => (
  <UiEntity
    uiTransform={{
      positionType: 'absolute',
      position: { bottom: 20, left: 20 },
      width: 250,
      flexDirection: 'column',
      padding: { top: 12, bottom: 12, left: 14, right: 14 }
    }}
    uiBackground={{ color: PANEL_BG }}
  >
    <Label value="GUARDIANES DEL FUEGO" fontSize={12} color={VIOLET} textAlign="middle-left" />
    {entries.slice(0, 5).map((e, i) => (
      <UiEntity
        key={i}
        uiTransform={{
          width: '100%',
          height: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: { top: 6 }
        }}
      >
        <UiEntity uiTransform={{ flexDirection: 'row', alignItems: 'center' }}>
          <Label value={`${i + 1}`} fontSize={12} font="monospace" color={i === 0 ? SPARK : MUTED} />
          <Label value={e.displayName} fontSize={13} color={WARM_WHITE} textAlign="middle-left" uiTransform={{ margin: { left: 10 } }} />
        </UiEntity>
        <Label value={`🔥 ${e.brasas}`} fontSize={13} font="monospace" color={MUTED} textAlign="middle-right" />
      </UiEntity>
    ))}
  </UiEntity>
)

// --- Onboarding ------------------------------------------------------------

const Onboarding = () => {
  const screen = currentScreen()
  const step = currentStep()
  const total = screenCount()
  const isLast = step === total - 1
  const reveal = getOnboardingReveal() // 0..1 ease-out, se reinicia por pantalla
  const cardAlpha = 0.15 + reveal * 0.83
  const rise = (1 - reveal) * 22 // desliza hacia arriba al entrar

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      uiBackground={{ color: OVERLAY_BG }}
    >
      {/* Tarjeta: tocar para avanzar (fade + slide por pantalla) */}
      <UiEntity
        uiTransform={{
          width: 560,
          height: 300,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          margin: { top: rise }
        }}
        uiBackground={{ color: withAlpha(CARD_BG, cardAlpha) }}
        onMouseDown={advanceOnboarding}
      >
        <Label value={screen.title} fontSize={30} color={withAlpha(EMBER, reveal)} />
        <Label
          value={screen.body}
          fontSize={17}
          color={withAlpha(WARM_WHITE, reveal * 0.95)}
          textAlign="middle-center"
          uiTransform={{ width: '92%', height: 96, margin: { top: 14 } }}
        />
        <ProgressDots total={total} active={step} alpha={reveal} />
        <Label
          value={isLast ? 'Toca para empezar' : 'Toca para continuar'}
          fontSize={13}
          color={withAlpha(MUTED, reveal)}
          uiTransform={{ margin: { top: 14 } }}
        />
      </UiEntity>

      {/* Saltar: siempre visible */}
      <Button
        value="Saltar"
        fontSize={14}
        variant="secondary"
        uiTransform={{ positionType: 'absolute', position: { top: 28, right: 28 }, width: 96, height: 42 }}
        onMouseDown={skipOnboarding}
      />
    </UiEntity>
  )
}

const ProgressDots = ({ total, active, alpha }: { total: number; active: number; alpha: number }) => (
  <UiEntity uiTransform={{ flexDirection: 'row', alignItems: 'center', margin: { top: 20 } }}>
    {Array.from({ length: total }).map((_, i) => (
      <UiEntity
        key={i}
        uiTransform={{ width: i === active ? 26 : 9, height: 9, margin: { left: 5, right: 5 } }}
        uiBackground={{ color: withAlpha(i === active ? EMBER : VIOLET, alpha * (i === active ? 1 : 0.5)) }}
      />
    ))}
  </UiEntity>
)

// --- Paleta "Twilight Ember" (unificada con el sitio companion) ------------
// Noche violeta/índigo con fuego ember + acento violeta. EMBER/AMBER se reservan
// para lo que es literalmente fuego (brasas, salud); VIOLET para estructura (labels).

const EMBER = Color4.create(1, 0.478, 0.176, 1) // #ff7a2d
const AMBER = Color4.create(1, 0.702, 0.278, 1) // #ffb347
const SPARK = Color4.create(1, 0.839, 0.42, 1) // #ffd66b
const VIOLET = Color4.create(0.635, 0.506, 1, 1) // #a281ff — acento estructural
const WARM_WHITE = Color4.create(0.961, 0.933, 0.902, 1) // #f5eee6
const MUTED = Color4.create(0.714, 0.682, 0.796, 1) // #b6aecb — gris con sesgo violeta
const PANEL_BG = Color4.create(0.055, 0.04, 0.086, 0.82) // noche violeta translúcida
const CARD_BG = Color4.create(0.098, 0.067, 0.157, 1) // #191128
const OVERLAY_BG = Color4.create(0.02, 0.015, 0.035, 0.72)
const BAR_TRACK = Color4.create(0.14, 0.11, 0.2, 1)

function withAlpha(c: Color4, a: number): Color4 {
  return Color4.create(c.r, c.g, c.b, Math.max(0, Math.min(1, a)))
}

// Verde/ámbar/rojo según salud.
function healthColor(pct: number): Color4 {
  if (pct >= 60) return Color4.create(0.3, 0.82, 0.35, 1)
  if (pct >= 30) return AMBER
  return Color4.create(0.92, 0.28, 0.16, 1)
}
