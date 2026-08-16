# QA multiplayer — checklist manual

No se puede automatizar (requiere el cliente real de Decentraland, no un navegador), así que
esto es lo que hay que correr a mano antes de someter la escena. Necesitas **2+ ventanas/perfiles
del Decentraland Desktop Client** (o `play.decentraland.org` con dos cuentas distintas) apuntando
al preview local (`npm run start`) o a la escena ya publicada.

## Setup

1. `npm run start` en este repo, esperar a que el preview esté listo.
2. Abrir 2 clientes de Decentraland separados (perfiles/cuentas distintas) apuntando al preview.
3. Tener a mano `npm run server-logs` en otra terminal para ver los logs estructurados
   (`[refugio] level event key=val`) en tiempo real mientras juegas.

## Casos a probar

### 1. Fogata crece con presencia (paso 2)
- [ ] Con 1 jugador presente, la fogata está en su tamaño base.
- [ ] Al entrar el 2° jugador, la fogata crece visiblemente en los siguientes ~1.5s
      (`FOGATA_RECALC_INTERVAL_SECONDS`).
- [ ] Al salir un jugador (cerrar esa ventana), la fogata encoge de vuelta.

### 2. Asientos (paso 3) — **el caso que se corrigió este lote**
- [ ] Jugador A se sienta en un tronco → aparece ocupado para el jugador B también (sincronizado).
- [ ] Jugador A se levanta (tap de nuevo) → el tronco vuelve a verse libre para B.
- [ ] **Caso clave**: Jugador A se sienta, luego **cierra el cliente sin pararse primero**
      (simula desconexión). El tronco debe liberarse solo, sin que nadie tenga que hacer nada —
      antes de este lote se quedaba "ocupado" para siempre. Verificar que B puede sentarse ahí
      después de que A se desconecte.
- [ ] Ambos jugadores tocan el MISMO tronco libre casi al mismo tiempo — sólo uno debe quedar
      sentado (el otro ve el tronco como ocupado). Es un caso límite conocido y aceptado (los
      asientos son client-authoritative vía `syncEntity`, no server-authoritative) — el objetivo
      es que converja a UN solo ocupante, no que se vea "roto" de forma permanente.

### 3. Minijuego "Guardianes del Fuego" (paso 4)
- [ ] La ronda arranca sola, sin que nadie la inicie manualmente (requisito duro: sin host).
- [ ] La leña aparece para AMBOS jugadores al mismo tiempo (mismo id, misma posición).
- [ ] A alimenta una leña → B ve esa leña desaparecer también (server-authoritative, un solo
      "ganador" por leña — confirmar que B NO puede alimentar la misma leña después de A).
- [ ] Alimentar leña estando lejos (fuera de `FEED_PROXIMITY_METERS`, revisar logs por
      `anti_cheat_reject reason=not_near_wood`) — no debe subir la salud del fuego.
- [ ] **Nuevo este lote**: tocar la misma leña muy rápido varias veces seguidas (spam) — revisar
      logs por `anti_cheat_reject reason=rate_limit`; sólo el primer tap dentro de la ventana de
      150ms debe contar.
- [ ] **Nuevo este lote**: alimentar varias leñas seguidas sin fallar ninguna → la racha
      (`woodResolved.streak`) debe subir de a uno; dejar que una leña expire → la racha vuelve a 0
      en el siguiente `woodResolved`.
- [ ] La ronda termina sola a los 180s (o antes si la salud llega a 0 — no debería, sólo baja).
- [ ] Ronda fallida (salud final < 50) vs. exitosa (≥ 50) — confirmar mensaje `roundEnded`
      correcto en logs y que ambos jugadores ven la transición de fase.

### 4. Brasas + leaderboard (paso 5)
- [ ] Ambos jugadores que participaron reciben brasas al cerrar la ronda (`brasasAwarded`,
      revisar en logs `leaderboard_updated size=N`).
- [ ] Un jugador que NO participó en absoluto (0 feedFire) no aparece en el leaderboard actualizado.
- [ ] El HUD del leaderboard in-world se actualiza para AMBOS jugadores tras el cierre de ronda.
- [ ] Si hay `COMPANION_URL`/`COMPANION_SECRET` configurados: el Wall of Guardians (sitio web)
      refleja el nuevo top dentro de los siguientes ~30s (su propio polling).

### 5. Invitación (paso 6)
- [ ] Jugador B entra con `?ref=<wallet de A>` en la URL, ambos completan una ronda juntos →
      ambos reciben el bonus de referido (`REFERRAL_BONUS`), una sola vez.
- [ ] Repetir una segunda ronda con los mismos dos jugadores → el bonus NO se vuelve a pagar
      (revisar `referralBonusClaimed` — no debería aparecer un segundo bonus en `brasasAwarded`).
- [ ] Self-referral (`?ref=` con la propia wallet) → no debe registrar nada
      (log `referral_register_failed` no debería aparecer; simplemente no hace nada, es el
      comportamiento esperado, no un error).

### 6. Reconexión / sleep del servidor
- [ ] Todos los jugadores salen de la escena → esperar ~2 min (el Multiplayer Server duerme) →
      volver a entrar. La escena debe arrancar limpia (nueva intermission, sin estado colgado
      de la sesión anterior).
- [ ] Mientras el servidor está "despertando" (banner "Encendiendo la fogata…"), el HUD no debe
      mostrar datos incorrectos (salud del fuego en 0, sin ronda activa).

## Qué NO hace falta probar manualmente (ya cubierto por revisión de código)

- Doble-alimentar la misma leña por el mismo jugador en el mismo tick — imposible por diseño:
  el runtime es single-threaded y `onFeedFire` es 100% síncrono (sin `await`), así que dos
  mensajes nunca se procesan "al mismo tiempo" — el segundo siempre ve `w.fed === true` del
  primero.
- Doble-registro de referido por mensajes duplicados del mismo jugador — cerrado este lote con
  un guard "en vuelo" (`referralInFlight`) en `registerReferral`, ver commit
  "Fix stale seat occupancy on disconnect...". Caso teórico, nunca observado en juego real, pero
  ya no es posible ni en teoría.
