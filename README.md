# FleetCore API

API REST para gestionar el mantenimiento de la flota de FleetCore.
Stack: NestJS, TypeScript, TypeORM, PostgreSQL, JWT.

**Coder:** TU NOMBRE COMPLETO
**Clan:** TU CLAN

## Requisitos
- Node.js 20+
- PostgreSQL 14+

## Instalación
```bash
git clone <URL_DEL_REPO>
cd fleetcore
npm install
```

## Variables de entorno
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales de PostgreSQL.

| Variable | Descripción |
|---|---|
| PORT | Puerto de la API |
| DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_NAME | Conexión a PostgreSQL |
| JWT_SECRET | Secreto para firmar los JWT |
| JWT_EXPIRES_IN | Duración del token (ej. 1h) |
| API_KEYS | Llaves válidas para integraciones, separadas por coma |

## Base de datos
Crea la base de datos vacía:
```bash
createdb fleetcore
```

## Ejecutar el seeder
```bash
npm run seed
```
Es idempotente: ejecutarlo varias veces no duplica registros.

## Levantar la API
```bash
npm run start:dev
```

## Swagger
http://localhost:3000/docs

## Credenciales de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@fleetcore.com | Admin123* |
| TECHNICIAN | tecnico1@fleetcore.com | Tecnico123* |
| TECHNICIAN | tecnico2@fleetcore.com | Tecnico123* |

API Keys de prueba: `demo-key-partner-1`, `demo-key-partner-2`

## Cómo usar
1. `POST /auth/login` con las credenciales de prueba.
2. Copia el `accessToken`, pulsa **Authorize** en Swagger y pégalo.
3. Endpoint de integración: `GET /integrations/vehicles/{plate}/maintenances` con el header `x-api-key`.

## Roles
- **ADMIN:** gestiona vehículos, mecánicos, talleres y mantenimientos; consulta historiales.
- **TECHNICIAN:** consulta sus mantenimientos asignados (con el taller) y actualiza su estado.

## Reglas de negocio principales
- Un vehículo no puede tener más de un mantenimiento activo.
- Un mecánico no puede tener mantenimientos activos con horarios cruzados (en ningún taller).
- Transiciones: SCHEDULED → IN_PROGRESS → COMPLETED; CANCELLED desde SCHEDULED o IN_PROGRESS. COMPLETED y CANCELLED son finales.
- IN_PROGRESS pone el vehículo en IN_MAINTENANCE; COMPLETED lo devuelve a AVAILABLE.
- Para completar se exige: trabajo realizado, costo final, fecha de finalización y kilometraje final.

## Base de datos (dump)
`fleetcore.sql` contiene la estructura y los datos de prueba.
