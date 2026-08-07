-- Estructura mínima para empezar a publicar desde el backoffice.
--
-- Crea las filas del carrusel con los mismos slugs que usa el contenido de
-- demostración, para que la home tenga la misma forma con datos reales. El
-- carrusel muestra únicamente contenidos de tipo 'short': a las publicaciones
-- del mapa se llega desde sus puntos en la traza.
--
-- Los contenidos no se siembran acá a propósito: se cargan desde /admin, así
-- nadie confunde material de ejemplo con material de obra.

insert into rails (slug, title, order_index, visible) values
  ('serie-un-minuto',       'Serie · un minuto de ingeniería', 1, true),
  ('antes-del-cano',        'Antes del caño',                  2, true),
  ('fabricacion-y-montaje', 'Fabricación y montaje',           3, true)
on conflict (slug) do nothing;
