/**
 * Contenido de “Propuesta de trivia Renault (2).pdf”, páginas 2–7.
 * Los nombres comerciales corresponden EXACTAMENTE al correo del cliente.
 * Las imágenes JPEG son las fotos oficiales descargadas de los enlaces Box
 * del cliente (boxUrl), convertidas a JPG web de máx. 1600 px sin recortes.
 * Estilo de copy del Figma: minúscula inicial y sin punto final; nombres comerciales exactos en mayúsculas.
 * `tagline` (opcional) reemplaza a `profile` en la etiqueta amarilla del resultado y del visor.
 */
export const CARS = {
  kwid: {
    id: 'kwid', name: 'NUEVO RENAULT KWID', short: 'KWID',
    profile: 'El urbano y práctico', motto: 'práctico, auténtico y urbano',
    description: 'te gusta aprovechar cada momento, moverte con libertad y encontrar soluciones inteligentes para tu día a día. NUEVO RENAULT KWID es ese compañero que combina practicidad, agilidad y personalidad para acompañarte en cada plan',
    image: '/images/trivia/kwid.jpg',
    boxUrl: 'https://lion.box.com/s/kep0gbc46eaw5iq2qpmhb4mno8ra4enr',
  },
  kardian: {
    id: 'kardian', name: 'RENAULT KARDIAN', short: 'KARDIAN',
    profile: 'El versátil y conectado', motto: 'versátil, moderno y conectado',
    description: 'eres de los que disfrutan tenerlo todo bajo control, pero siempre están abiertos a nuevos planes. RENAULT KARDIAN combina tecnología, dinamismo y versatilidad para seguirte el ritmo',
    image: '/images/trivia/kardian.jpg',
    boxUrl: 'https://lion.box.com/s/1qbeo5odlao0qjwtd7pfsvwfy504uuop',
  },
  duster: {
    id: 'duster', name: 'RENAULT DUSTER HYBRID E-TECH 4X4', short: 'DUSTER HYBRID E-TECH 4X4',
    profile: 'El aventurero y explorador', motto: 'aventurero, explorador y auténtico',
    description: 'para ti, los mejores planes empiezan fuera de la rutina. Te encanta descubrir nuevos destinos, explorar diferentes terrenos y vivir experiencias sin límites. RENAULT DUSTER HYBRID E-TECH 4X4 está listo para acompañarte en cada aventura',
    image: '/images/trivia/duster.jpg',
    boxUrl: 'https://lion.box.com/s/s8z48hs92zf3d9fdr8t4ayctj835fug2',
  },
  arkana: {
    id: 'arkana', name: 'RENAULT ARKANA HYBRID E-TECH', short: 'ARKANA HYBRID E-TECH',
    profile: 'El deportivo y sofisticado', motto: 'deportivo, sofisticado y auténtico',
    description: 'te gusta marcar la diferencia y disfrutar de cada experiencia con personalidad. RENAULT ARKANA HYBRID E-TECH combina una silueta deportiva, tecnología híbrida y dinamismo para quienes tienen un estilo propio',
    image: '/images/trivia/arkana.jpg',
    boxUrl: 'https://lion.box.com/s/cabyz7zm8g6whxuu3k7n3h3hszn4ed6a',
  },
  koleos: {
    id: 'koleos', name: 'RENAULT KOLEOS FULL HYBRID E-TECH', short: 'KOLEOS FULL HYBRID E-TECH',
    profile: 'El premium y familiar', motto: 'premium, familiar y sofisticado',
    description: 'disfrutas compartir, viajar y crear experiencias memorables. Para ti, cada detalle cuenta y la comodidad es indispensable. RENAULT KOLEOS FULL HYBRID E-TECH convierte cada recorrido en una experiencia extraordinaria',
    image: '/images/trivia/koleos.jpg',
    boxUrl: 'https://lion.box.com/s/h5nnq3q3a4giwxkqlm2y8top2fkngdpl',
  },
  filante: {
    id: 'filante', name: 'RENAULT FILANTE FULL HYBRID E-TECH', short: 'FILANTE FULL HYBRID E-TECH',
    profile: 'El exclusivo e innovador', tagline: 'Una nueva experiencia de confort', motto: 'exclusivo, innovador y extraordinario',
    description: 'no te conformas con lo convencional, buscas experiencias superiores; disfrutas la innovación y valoras cada detalle. RENAULT FILANTE FULL HYBRID E-TECH representa una nueva forma de vivir el lujo, la tecnología y el confort',
    image: '/images/trivia/filante.jpg',
    boxUrl: 'https://lion.box.com/s/qm0067uend3ofu77adu81hsg76wa4yq4',
  },
};

export const QUESTIONS = [
  {
    text: '¿cómo sería tu plan perfecto para un fin de semana?',
    options: [
      { text: 'recorrer la ciudad, descubrir nuevos lugares y disfrutar de planes espontáneos', car: 'kwid' },
      { text: 'tener diferentes planes, desde salir a comer hasta hacer una escapada de último momento', car: 'kardian' },
      { text: 'escaparme de la ciudad, explorar nuevos caminos y vivir una aventura fuera de lo convencional', car: 'duster' },
      { text: 'salir a disfrutar de nuevos destinos, siempre con estilo y personalidad', car: 'arkana' },
    ],
  },
  {
    text: '¿qué es lo que más valoras al momento de conducir?',
    options: [
      { text: 'la agilidad, la practicidad y la facilidad para moverme por la ciudad', car: 'kwid' },
      { text: 'la capacidad de enfrentar diferentes terrenos y disfrutar tanto de la ciudad como de la aventura', car: 'duster' },
      { text: 'el espacio, la estabilidad y la comodidad para que todos disfruten el recorrido', car: 'koleos' },
      { text: 'la potencia, la innovación y una experiencia de conducción sofisticada', car: 'filante' },
    ],
  },
  {
    text: 'si pudieras elegir un atributo indispensable para tu próximo carro, ¿cuál sería?',
    options: [
      { text: 'tecnología, conectividad y versatilidad para mi día a día', car: 'kardian' },
      { text: 'diseño deportivo y una personalidad que no pase desapercibida', car: 'arkana' },
      { text: 'espacio, confort y tecnología para viajar como quiero', car: 'koleos' },
      { text: 'lujo, innovación y tecnología de última generación', car: 'filante' },
    ],
  },
  {
    text: '¿qué necesitas que tu próximo carro te permita hacer?',
    options: [
      { text: 'moverme fácilmente por la ciudad y aprovechar cada recorrido', car: 'kwid' },
      { text: 'salir de la rutina, explorar nuevos destinos y enfrentar caminos diferentes', car: 'duster' },
      { text: 'compartir viajes y experiencias con mi familia o amigos, con todo el confort', car: 'koleos' },
      { text: 'disfrutar cada trayecto con una experiencia premium, tecnología y comodidad superior', car: 'filante' },
    ],
  },
  {
    text: '¿cuál de estas frases te representa mejor?',
    options: [
      { text: 'me gusta estar conectado, disfrutar la tecnología y adaptarme a cualquier plan', car: 'kardian' },
      { text: 'la aventura comienza donde termina el camino conocido', car: 'duster' },
      { text: 'mi estilo habla por mí. Me gusta destacar y disfrutar cada experiencia', car: 'arkana' },
      { text: 'no me conformo con lo convencional: siempre busco lo extraordinario', car: 'filante' },
    ],
  },
];

/**
 * Respuesta: índices de 0 a 3 por pregunta.
 * Reglas PDF: un punto por opción; empate -> respuesta P4; luego respuesta P5.
 * Si persiste el empate, usa el primer coche empatado elegido en el cuestionario
 * para evitar resultados aleatorios/inconsistentes.
 */
export function getTriviaResult(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length ||
    !answers.every((choice) => Number.isInteger(choice) && choice >= 0 && choice < 4)) {
    throw new Error('La trivia requiere exactamente cinco respuestas válidas.');
  }
  const points = Object.fromEntries(Object.keys(CARS).map((key) => [key, 0]));
  const selectedCars = answers.map((choice, index) => QUESTIONS[index].options[choice].car);
  selectedCars.forEach((car) => { points[car] += 1; });
  const highest = Math.max(...Object.values(points));
  const tied = Object.keys(points).filter((id) => points[id] === highest);
  const winningId = tied.length === 1
    ? tied[0]
    : [selectedCars[3], selectedCars[4], ...selectedCars].find((car) => tied.includes(car));
  return { car: CARS[winningId], points };
}
