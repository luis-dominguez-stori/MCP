# OpenSearch Logs MCP Server

MCP (Model Context Protocol) server para consultar logs de OpenTelemetry en OpenSearch. Soporta ambientes de desarrollo (dev) y producción (prod).

## Arquitectura

El servidor sigue los principios SOLID y Clean Architecture:

```
src/
├── index.ts                     # Entry point
├── server.ts                    # MCP Server setup
├── config/
│   └── environments.ts          # Environment configuration
├── types/
│   └── index.ts                 # Type definitions
├── services/
│   ├── opensearch-client.ts     # HTTP client for OpenSearch
│   └── log-search.service.ts    # Business logic
├── tools/
│   ├── tool-definitions.ts      # Tool schemas
│   └── tool-handlers.ts         # Tool execution
└── utils/
    ├── query-builder.ts         # Query construction (Builder pattern)
    └── time-range.ts            # Time utilities
```

### Principios Aplicados

- **Single Responsibility (SRP)**: Cada módulo tiene una única responsabilidad
- **Open/Closed (OCP)**: Fácil agregar nuevas herramientas sin modificar código existente
- **Dependency Inversion (DIP)**: Los servicios dependen de abstracciones (interfaces)
- **Builder Pattern**: `QueryBuilder` para construcción fluida de queries

## Instalación

```bash
cd Tools/mcp-opensearch-logs
npm install
npm run build
```

## Configuración en Cursor

Agrega esto a tu configuración de Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "opensearch-logs": {
      "command": "node",
      "args": ["/ruta/al/proyecto/Tools/mcp-opensearch-logs/dist/index.js"],
      "env": {
        "OPENSEARCH_DEV_USERNAME": "tu-usuario-dev",
        "OPENSEARCH_DEV_PASSWORD": "tu-password-dev",
        "OPENSEARCH_PROD_USERNAME": "tu-usuario-prod",
        "OPENSEARCH_PROD_PASSWORD": "tu-password-prod"
      }
    }
  }
}
```

## Herramientas Disponibles

### `search_logs`

Búsqueda libre con sintaxis Lucene.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| query | string | ✅ | Query en sintaxis Lucene |
| timeRange | `15m` \| `1h` \| `6h` \| `24h` \| `7d` | ❌ | Rango de tiempo (default: 1h) |
| size | number | ❌ | Máximo de resultados (default: 50, max: 200) |

**Ejemplos:**
- "Busca logs que contengan 'error' en dev de la última hora"
- "Busca logs con status 500 en prod de las últimas 6 horas"

### `search_by_trace`

Busca todos los logs de un trace de OpenTelemetry.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| traceId | string | ✅ | ID del trace |
| size | number | ❌ | Máximo de resultados (default: 100) |

**Ejemplo:**
- "Dame todos los logs del trace abc123 en dev"

### `search_by_service`

Filtra logs por nombre de servicio.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| serviceName | string | ✅ | Nombre del servicio |
| level | `DEBUG` \| `INFO` \| `WARN` \| `ERROR` \| `FATAL` | ❌ | Nivel de log |
| query | string | ❌ | Query adicional |
| timeRange | string | ❌ | Rango de tiempo |
| size | number | ❌ | Máximo de resultados |

**Ejemplos:**
- "Busca logs del servicio stori-ios en prod"
- "Dame los errores del servicio stori-ios en dev"

### `search_errors`

Busca logs de nivel ERROR o superior (severityNumber >= 17).

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| serviceName | string | ❌ | Filtrar por servicio |
| query | string | ❌ | Query adicional |
| timeRange | string | ❌ | Rango de tiempo |
| size | number | ❌ | Máximo de resultados |

**Ejemplos:**
- "Dame los errores de la última hora en prod"
- "Busca errores relacionados con KYC en dev"

### `get_field_values`

Obtiene los valores más comunes de un campo (agregación).

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| field | string | ✅ | Campo a agregar |
| size | number | ❌ | Máximo de valores únicos (default: 20) |

**Ejemplos:**
- "Qué valores tiene el campo 'event' en prod?"
- "Dame los tipos de error más comunes en dev"

### `search_by_field`

Busca por un campo y valor específico.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |
| field | string | ✅ | Nombre del campo |
| value | string | ✅ | Valor a buscar |
| timeRange | string | ❌ | Rango de tiempo |
| size | number | ❌ | Máximo de resultados |

**Ejemplo:**
- "Busca logs con transactionId=abc123 en prod"

### `get_mapping`

Obtiene el mapeo de campos del índice.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |

**Ejemplo:**
- "Qué campos están disponibles en los logs de prod?"

### `get_sample_log`

Obtiene un log de ejemplo para ver la estructura.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| environment | `dev` \| `prod` | ✅ | Ambiente a consultar |

**Ejemplo:**
- "Dame un ejemplo de log de prod para ver la estructura"

## Sintaxis de Búsqueda Lucene

El campo `query` soporta sintaxis Lucene completa:

| Sintaxis | Descripción | Ejemplo |
|----------|-------------|---------|
| `término` | Busca en cualquier campo | `error` |
| `campo:valor` | Busca en campo específico | `event:kyc_error` |
| `campo:*valor*` | Wildcard | `errorMessage:*timeout*` |
| `AND` | Ambos términos | `error AND authentication` |
| `OR` | Cualquier término | `error OR warning` |
| `NOT` | Excluye término | `NOT debug` |
| `[a TO b]` | Rango | `statusCode:[400 TO 499]` |
| `"frase exacta"` | Match exacto | `"connection refused"` |

## Rangos de Tiempo

| Valor | Descripción |
|-------|-------------|
| `15m` | Últimos 15 minutos |
| `1h` | Última hora (default) |
| `6h` | Últimas 6 horas |
| `24h` | Últimas 24 horas |
| `7d` | Últimos 7 días |

## Desarrollo

```bash
# Desarrollo con watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Estructura de Logs OpenTelemetry

Los logs siguen el esquema OpenTelemetry:

```json
{
  "time": "2024-01-15T10:30:00.000Z",
  "severityText": "ERROR",
  "severityNumber": 17,
  "body": "Error message",
  "attributes": {
    "event": "kyc_error",
    "kycFlow": "creditL1",
    "transactionId": "abc123"
  },
  "resource": {
    "service.name": "stori-ios",
    "service.version": "1.0.0"
  }
}
```
