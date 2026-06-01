# Sistema de Gestión de Convivencia Escolar

> Proyecto semestral — Ingeniería de Software 2  
> Universidad de Concepción — Equipo 02  
> Integrantes: Diego Alday Cortés, Ignacio Jara Valdebenito, Gabriela Muñoz Castillo, Bastián Zapata

---

## Descripción

Sistema web multi-rol para el registro, seguimiento y análisis de incidentes de convivencia escolar en establecimientos educacionales. Reemplaza los mecanismos manuales (anotaciones en papel, correos, carpetas físicas) por una plataforma digital integrada, centralizada y trazable.

## Estructura del proyecto

```
proyecto-semestral-is2/
├── backend/        # API REST — Node.js + Express + Prisma + PostgreSQL
├── frontend/       # Interfaz web — React + Vite
├── docs/           # Informes, diagramas y documentación
└── README.md
```

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Frontend | React 18, Vite |
| Autenticación | JWT (jsonwebtoken) + bcryptjs |
| Testing | Vitest |

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Nodercif/proyecto-semestral-is2.git
cd proyecto-semestral-is2
```

### 2. Configurar el backend

```bash
cd backend
npm install --force
cp .env.example .env
```

Editar `.env` con tus datos:

```
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/convivencia_escolar"
JWT_SECRET=clave_super_secreta_is2_2026
JWT_EXPIRES_IN=8h
```

Crear la base de datos en PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE convivencia_escolar;"
```

Aplicar migraciones e insertar datos de prueba:

```bash
npm run db:migrate
npm run db:seed
```

Iniciar el servidor:

```bash
npm run dev
```

El backend corre en `http://localhost:3000`.

### 3. Configurar el frontend

```bash
cd ../frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`.

---

## Credenciales de prueba

Todos los usuarios tienen la misma contraseña: **`Admin1234!`**

| Email | Rol |
|---|---|
| `admin@colegio.cl` | Administrador |
| `gabriela.munoz@colegio.cl` | Encargado de Convivencia |
| `carlos.martinez@colegio.cl` | Docente |
| `beatriz.rojas@colegio.cl` | Inspector |
| `diego.herrera@colegio.cl` | Orientador |
| `elena.castro@colegio.cl` | Equipo Directivo |

---

## Endpoints disponibles

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Obtener usuario autenticado |

### Incidentes
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/incidentes` | Registrar incidente (HU1) | Todos |
| GET | `/incidentes` | Listar incidentes | Todos |
| POST | `/incidentes/:id/involucrados` | Agregar involucrado (HU2) | Admin, Encargado, Inspector |

### Estudiantes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/estudiantes/:id/incidentes` | Historial de incidentes (HU5) |

---

## Scripts disponibles

### Backend

```bash
npm run dev          # Iniciar servidor en modo desarrollo
npm run db:migrate   # Aplicar migraciones de Prisma
npm run db:seed      # Insertar datos de prueba
npm run db:studio    # Abrir Prisma Studio (explorador visual de BD)
npm run db:reset     # Resetear base de datos
npm test             # Ejecutar tests con Vitest
```

### Frontend

```bash
npm run dev      # Iniciar en modo desarrollo
npm run build    # Compilar para producción
npm run preview  # Previsualizar build
```

---

## Funcionalidades implementadas (Sprint 1)

- ✅ **HU1** — Registrar incidente con fecha, hora, descripción, tipo y gravedad
- ✅ **HU2** — Registrar estudiantes involucrados (afectado, responsable, testigo, interviniente)
- ✅ **HU5** — Consultar historial de incidentes de un estudiante con filtros opcionales
- ✅ Autenticación con JWT y control de acceso por rol
- ✅ Base de datos relacional con PostgreSQL y Prisma ORM
- ✅ Tests automatizados con Vitest

---

## Equipo

| Nombre | GitHub |
|---|---|
| Diego Alday Cortés | @usuario |
| Ignacio Jara Valdebenito | @ignacioj049 |
| Gabriela Muñoz Castillo | @Nodercif |
| Bastián Zapata | @usuario |
