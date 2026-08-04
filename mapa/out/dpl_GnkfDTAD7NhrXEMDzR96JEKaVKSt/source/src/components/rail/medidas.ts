/**
 * Alto del cajón de contenidos cuando está contraído.
 *
 * Lo comparten `ContentDrawer` —que lo aplica como max-height— y `TrazaMap`,
 * que lo descuenta al encuadrar la traza para que la línea no quede tapada por
 * las tarjetas. Son dos componentes hermanos sin relación de props, y esta
 * constante es lo que los mantiene sincronizados.
 */
export const ALTO_CAJON_RELATIVO = 0.44;
export const ALTO_CAJON_MAX = 324;
