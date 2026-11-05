// SOLO PARA DEMOS: interruptor único de los datos simulados del tablero (src/app/mocks).
// true  = el tablero de inicio y el panel de resumen usan datos ficticios, porque el CRUD
//         todavía no entrega los datos que necesita el tablero.
// false = usan el CRUD real.
// El flujo de contratación (consulta, registro, validación de contratista) NO usa datos simulados.
// Para quitar el mock: borrar src/app/mocks y las 2 referencias a USAR_DATOS_SIMULADOS
// en tablero-datos.service.ts y tablero.utils.ts.
export const USAR_DATOS_SIMULADOS = true;
