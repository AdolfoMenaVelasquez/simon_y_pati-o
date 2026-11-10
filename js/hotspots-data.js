// ============================================================
// Puntos de interés del recorrido interior.
//
// Agrega, quita o edita objetos de esta lista para controlar los
// "puntos calientes" que aparecen dentro del modelo 3D interior.
// "position" son coordenadas x, y, z EN LAS MISMAS UNIDADES que tu
// archivo casa-interior.glb (normalmente metros). Ajusta estos
// valores una vez que tengas tu modelo real cargado: puedes abrir
// la consola del navegador (F12) y usar las flechas de depuración
// que se explican en el README para leer tu posición actual.
// ============================================================

export const HOTSPOTS = [
  {
    id: 'sala-recibo',
    position: { x: -1.4, y: 1.3, z: -2.0 },
    label: 'Sala de recibo',
    title: 'La sala de recibo',
    description:
      'Reemplaza este texto con la historia de este ambiente: quiénes eran recibidos aquí, qué muebles originales se conservan y qué anécdotas familiares están asociadas a este espacio.'
  },
  {
    id: 'comedor',
    position: { x: 1.6, y: 1.3, z: 0.4 },
    label: 'Comedor',
    title: 'El comedor',
    description:
      'Describe aquí el mobiliario, la vajilla o los objetos que se exhiben en este ambiente, y cualquier detalle histórico relevante sobre las reuniones que tenían lugar en este espacio de la casa.'
  },
  {
    id: 'escalera',
    position: { x: 0.2, y: 1.3, z: 2.6 },
    label: 'Escalera principal',
    title: 'La escalera principal',
    description:
      'Cuenta la historia de este elemento arquitectónico: materiales originales, año de construcción y cualquier restauración que haya recibido a lo largo del tiempo.'
  }
];
