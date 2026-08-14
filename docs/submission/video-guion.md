# Guion del video de demo — Refugio

**Duración objetivo:** 90–120 s. **Idioma:** narración/subtítulos en inglés (judge-facing).
**Regla de oro del hackathon:** el video DEBE mostrar el componente social — **jugadores reales interactuando**, nunca un solo jugador solo. Consigue al menos 2 (idealmente 3) personas en la escena a la vez para la parte del minijuego.

**Setup de grabación:**
- Publica la escena o corre el preview con el Multiplayer Server (`npm run start`) y conecta 2–3 ventanas/personas al mismo realm.
- Graba desde la ventana de UN jugador (primera persona), con 1–2 avatares más visibles alrededor de la fogata.
- Ten a los otros jugadores coordinados de antemano sobre qué hacer en cada beat (aunque el juego no lo requiera, para el video sí conviene guiarlo).

---

## Estructura por beats

### 0:00–0:10 — Hook (el problema)
- **Visual:** la fogata pequeña, un solo avatar llegando a una escena tranquila.
- **Texto en pantalla:** *"Most social worlds are empty rooms."*
- **Narración:** "Most metaverse spaces only feel alive during a hosted event. Refugio is different."

### 0:10–0:25 — El fuego responde a la presencia
- **Visual:** entran el 2º y 3º avatar; **la fogata crece visiblemente** con cada uno.
- **Texto:** *"The fire grows with every person who shows up."*
- **Narración:** "The campfire scales in real time with how many people are present. The space reacts to you being there — no host needed."
- *Tip: entra los avatares uno por uno con 2–3s de separación para que se note el crecimiento.*

### 0:25–0:40 — Sentarse (presencia legible)
- **Visual:** un jugador toca un tronco y se sienta; en las otras ventanas el asiento se ilumina.
- **Texto:** *"Sit down. Everyone sees you join the circle."*
- **Narración:** "Tap a log to sit. Occupancy syncs to every client — presence becomes something you can see."

### 0:40–1:05 — Guardianes del Fuego (el núcleo cooperativo)
- **Visual:** aparece leña, **varios jugadores la tocan a tiempo**, la barra de salud del fuego sube; mostrar el banner de ronda y el HUD.
- **Texto:** *"Keep the fire alive — together."*
- **Narración:** "When firewood appears, anyone taps it in time to feed the fire. The round is run by Decentraland's authoritative server, not by a host — so it works even if you arrive cold and alone."
- *Beat clave para "Social Value" y "funciona sin host". Muestra 2+ manos alimentando el mismo fuego.*

### 1:05–1:20 — Recompensa + leaderboard (retención)
- **Visual:** cierre de ronda, el HUD suma brasas, aparece/actualiza el **panel de leaderboard** in-world.
- **Texto:** *"Earn embers. Climb the leaderboard. Come back."*
- **Narración:** "Finish a round and everyone earns embers — saved to your wallet and ranked on a persistent leaderboard."

### 1:20–1:30 — Invitación + cierre
- **Visual:** mostrar el link `?ref=` (o un lower-third con el concepto), avatares alrededor del fuego ya grande.
- **Texto:** *"Every guardian brings the next one."*
- **Narración / cierre:** "Refugio — because a fire is just light until someone sits down next to you."
- **Cierra con:** nombre + logo/lockup de Refugio y el link de la escena.

---

## Checklist de lo que el video TIENE que probar (para los jueces)
- [ ] Se ve **más de un jugador real** interactuando simultáneamente (requisito duro)
- [ ] La fogata **crece con la presencia** (comparativa 1 vs varios)
- [ ] Asientos sincronizados entre clientes
- [ ] Minijuego cooperativo de punta a punta (leña → tap → salud sube → ronda cierra)
- [ ] Brasas otorgadas + leaderboard visible
- [ ] Se comunica explícitamente que **no hay host** (el server arbitra)

## Notas de producción
- Sube el video a YouTube/Vimeo (no un archivo suelto) y pega el link en la BUIDL page.
- Subtítulos quemados si la narración es en vivo con ruido — mejor voz limpia o música + texto en pantalla.
- Si no consigues 3 personas, 2 bastan para no descalificar, pero 3 se ve mucho más "social".
- Mantén los cortes rápidos; el beat del minijuego (0:40–1:05) es el que más pesa, dale aire.
