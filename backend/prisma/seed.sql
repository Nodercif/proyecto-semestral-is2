-- Datos de prueba
-- Ejecutar DESPUÉS de crear el squema

-- Funcionarios
INSERT INTO "FuncionariosInstitucionales" ("rut", "nombre", "apellidos", "cargo") VALUES
  ('21373300-1', 'Gabriela', 'Muñoz Castillo', 'Encargado_convivencia'),
  ('23456789-0', 'Carlos',  'Martínez López',   'DOCENTE'),
  ('34567890-1', 'Beatriz', 'Rojas Fuentes',    'INSPECTOR'),
  ('45678901-2', 'Diego',   'Herrera Soto',     'ORIENTADOR'),
  ('56789012-3', 'Elena',   'Castro Vidal',     'EQUIPO_DIRECTIVO'),
  ('98765432-1', 'Roberto', 'Sánchez Mora',     'ADMINISTRADOR');

-- Usuarios (password: "Temporal123!" — hash bcrypt de ejemplo)
 
INSERT INTO "Usuario" ("email", "passwordHash", "rol", "funcionarioId") VALUES
  ('gabriela.munoz@colegio.cl',
   '$2b$10$hashed_example_encargado',
   'ENCARGADO_CONVIVENCIA', 1),
 
  ('carlos.martinez@colegio.cl',
   '$2b$10$hashed_example_docente',
   'DOCENTE', 2),
 
  ('beatriz.rojas@colegio.cl',
   '$2b$10$hashed_example_inspector',
   'INSPECTOR', 3),
 
  ('diego.herrera@colegio.cl',
   '$2b$10$hashed_example_orientador',
   'ORIENTADOR', 4),
 
  ('elena.castro@colegio.cl',
   '$2b$10$hashed_example_directivo',
   'EQUIPO_DIRECTIVO', 5),
 
  ('admin@colegio.cl',
   '$2b$10$hashed_example_admin',
   'ADMINISTRADOR', 6);
 
-- Estudiantes
 
INSERT INTO "Estudiante" ("rut", "nombres", "apellidos", "curso") VALUES
  ('11111111-1', 'Martín',    'Alvarado Torres',  '1°A'),
  ('22222222-2', 'Sofía',     'Becerra Núñez',    '1°A'),
  ('33333333-3', 'Joaquín',   'Contreras Ríos',   '2°B'),
  ('44444444-4', 'Valentina', 'Díaz Morales',     '2°B'),
  ('55555555-5', 'Sebastián', 'Espinoza Aguilar', '3°C'),
  ('66666666-6', 'Camila',    'Flores Pizarro',   '3°C'),
  ('77777777-7', 'Tomás',     'García Salinas',   '4°D'),
  ('88888888-8', 'Isabella',  'Henríquez Vera',   '4°D');
 
-- Incidente de prueba 
-- Registrado por la encargada de convivencia (funcionarioId=1)
 
INSERT INTO "Incidente" ("fecha", "descripcion", "tipo", "gravedad", "registradoPorId") VALUES
  (
    '2026-04-10 10:30:00',
    'Pelea entre estudiantes durante el recreo. Martín golpeó a Joaquín sin motivo aparente.',
    'AGRESION_FISICA',
    'GRAVE',
    1
  );
 
-- Involucrados en el incidente (id=1)
 
INSERT INTO "Involucrado" ("rol", "estudianteId", "incidenteId", "observacion") VALUES
  ('RESPONSABLE', 1, 1, 'Inició la agresión física'),           -- Martín
  ('AFECTADO',    3, 1, 'Recibió el golpe, sin lesiones graves'), -- Joaquín
  ('TESTIGO',     2, 1, NULL),                                  -- Sofía
  ('TESTIGO',     4, 1, NULL);                                  -- Valentina
 
-- Caso asociado al incidente
 
INSERT INTO "Caso" ("titulo", "estado") VALUES
  ('Agresión física en recreo — Martín A. vs Joaquín C.', 'EN_SEGUIMIENTO');
 
INSERT INTO "CasoIncidente" ("casoId", "incidenteId") VALUES
  (1, 1);
 
-- Acción de intervención
 
INSERT INTO "AccionIntervencion" ("tipo", "descripcion", "casoId", "fecha") VALUES
  (
    'CITACION',
    'Se citó a los apoderados de Martín Alvarado para el día 12 de abril a las 14:00 hrs.',
    1,
    '2026-04-10 11:00:00'
  ),
  (
    'DERIVACION_ORIENTACION',
    'Se derivó a Joaquín Contreras al orientador para evaluación de bienestar emocional.',
    1,
    '2026-04-10 11:30:00'
  );
 
-- Segundo incidente (reincidencia de Martín)
-- Para probar la alerta de reincidencia (RF16)
 
INSERT INTO "Incidente" ("fecha", "descripcion", "tipo", "gravedad", "registradoPorId") VALUES
  (
    '2026-04-22 08:15:00',
    'Martín insultó a compañero en sala de clases durante la clase de matemáticas.',
    'AGRESION_VERBAL',
    'MODERADO',
    2   -- Registrado por el docente Carlos
  );
 
INSERT INTO "Involucrado" ("rol", "estudianteId", "incidenteId", "observacion") VALUES
  ('RESPONSABLE', 1, 2, 'Reincidencia: segundo incidente del mismo estudiante'),
  ('AFECTADO',    5, 2, 'Insultos reiterados'),
  ('TESTIGO',     6, 2, NULL);
 
INSERT INTO "Caso" ("titulo", "estado") VALUES
  ('Agresión verbal en aula — Martín A. (reincidencia)', 'ABIERTO');
 
INSERT INTO "CasoIncidente" ("casoId", "incidenteId") VALUES
  (2, 2);