# Preguntas pendientes — Refugio

1. **Deadline real**: el listing de DoraHacks tiene un conflicto — el resumen dice `2026/09/03 18:00`, el cronograma detallado dice `September 4, 2026`. Confirmar en el Discord de Friendzone cuál es la fecha/hora/zona horaria exacta, antes de entrar a la última semana (idealmente antes del 28 de agosto).
2. **Solo o en equipo**: los equipos están permitidos según las bases. Decidir si se busca partner (ayudaría sobre todo para el testing con múltiples jugadores reales, que es requisito de facto dado que la experiencia no puede ser single-player).
3. **Alcance del sitio companion**: confirmar si vale la pena el stretch goal de Next.js + Supabase para el leaderboard público (criterio "Retention and Discovery Value") o si el tiempo se prioriza 100% en el núcleo de Decentraland.
4. **Clave del parámetro `?ref=` (paso 6 Invitación)**: el cliente lee el referido desde `getExplorerInformation().configurations['ref']` (`~system/Runtime`). Verificar en preview/producción que un link con `?ref=<wallet>` realmente expone esa clave en `configurations`; si el explorador usa otra clave o mecanismo, ajustar `REFERRAL_URL_PARAM` en `src/shared/constants.ts`. El servidor valida siempre (no self-referral, una vez), así que un valor incorrecto no rompe nada, sólo no otorgaría el bonus.

---
*Mover cada pregunta a resuelta (tachada o eliminada) en cuanto se confirme, y anotar la respuesta en el master-prompt.md si cambia una decisión de diseño.*
