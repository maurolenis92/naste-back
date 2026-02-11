# Guía de Paginación y Filtros

## Descripción General

Los endpoints de productos y facturas ahora soportan paginación y filtros avanzados para manejar grandes volúmenes de datos de manera eficiente.

## Respuesta Paginada

Todos los endpoints de listado ahora retornan una respuesta con el siguiente formato:

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

### Campos de Paginación

- **currentPage**: Página actual (1-indexed)
- **pageSize**: Cantidad de items por página
- **totalItems**: Total de registros que coinciden con los filtros
- **totalPages**: Total de páginas disponibles
- **hasNextPage**: `true` si existe una página siguiente
- **hasPreviousPage**: `true` si existe una página anterior
- **nextPage**: Número de la siguiente página o `null` si no existe
- **previousPage**: Número de la página anterior o `null` si no existe

## Endpoints de Productos

### GET /api/products

**Parámetros de Paginación:**

- `page` (opcional, default: 1): Número de página
- `pageSize` (opcional, default: 10): Cantidad de items por página

**Filtros Disponibles:**

- `isActive` (opcional): Filtrar por estado activo (`true` o `false`)
- `search` (opcional): Buscar por código o descripción (case-insensitive)
- `minPrice` (opcional): Precio mínimo
- `maxPrice` (opcional): Precio máximo

**Ejemplos:**

```bash
# Obtener primera página con 10 productos
GET /api/products?page=1&pageSize=10

# Obtener segunda página con 20 productos
GET /api/products?page=2&pageSize=20

# Buscar productos activos que contengan "laptop"
GET /api/products?isActive=true&search=laptop

# Filtrar productos por rango de precio
GET /api/products?minPrice=100&maxPrice=500

# Combinar filtros y paginación
GET /api/products?isActive=true&search=laptop&minPrice=500&page=1&pageSize=15
```

**Respuesta de Ejemplo:**

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "LAP001",
      "description": "Laptop Dell",
      "price": 1200.0,
      "stock": 5,
      "imageBase64": null,
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

## Endpoints de Facturas

### GET /api/invoices

**Parámetros de Paginación:**

- `page` (opcional, default: 1): Número de página
- `pageSize` (opcional, default: 10): Cantidad de items por página

**Filtros Disponibles:**

- `status` (opcional): Estado de la factura (`PENDING`, `PAID`, `CANCELLED`)
- `startDate` (opcional): Fecha de inicio (ISO 8601 format)
- `endDate` (opcional): Fecha de fin (ISO 8601 format)
- `createdById` (opcional): UUID del usuario que creó la factura
- `search` (opcional): Buscar en nombre del cliente, documento, dirección o barrio
- `origin` (opcional): Origen de la factura (`STORE`, `PHONE_ORDER`, `WEB_ORDER`)
- `paymentMethod` (opcional): Método de pago (`CASH`, `CARD`, `TRANSFER`, `NEQUI`, `DAVIPLATA`)
- `city` (opcional): Filtrar por ciudad

**Ejemplos:**

```bash
# Obtener primera página con 10 facturas
GET /api/invoices?page=1&pageSize=10

# Obtener facturas pendientes
GET /api/invoices?status=PENDING

# Obtener facturas por rango de fechas
GET /api/invoices?startDate=2026-01-01&endDate=2026-01-31

# Buscar facturas por nombre de cliente
GET /api/invoices?search=Juan

# Filtrar por método de pago y ciudad
GET /api/invoices?paymentMethod=CASH&city=Bogotá

# Combinar múltiples filtros con paginación
GET /api/invoices?status=PAID&origin=WEB_ORDER&page=2&pageSize=20
```

**Respuesta de Ejemplo:**

```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2026-001",
      "status": "PENDING",
      "origin": "WEB_ORDER",
      "paymentMethod": "CASH",
      "customerName": "Juan Pérez",
      "customerIdDoc": "1234567890",
      "customerPhone": "+57 300 1234567",
      "customerEmail": "juan@example.com",
      "city": "Bogotá",
      "neighborhood": "Chapinero",
      "address": "Calle 45 # 12-34",
      "invoiceDate": "2026-01-15T14:30:00Z",
      "deliveryDate": null,
      "total": 150000.00,
      "createdById": "uuid",
      "createdAt": "2026-01-15T14:30:00Z",
      "updatedAt": "2026-01-15T14:30:00Z",
      "items": [...],
      "createdBy": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 230,
    "totalPages": 23,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

## Mejores Prácticas

### 1. Tamaño de Página Recomendado

- **Móvil**: 10-15 items por página
- **Desktop**: 20-50 items por página
- **Máximo recomendado**: 100 items por página

### 2. Navegación de Páginas

```typescript
// Ejemplo en JavaScript/TypeScript
const goToPage = async (page: number) => {
  const response = await fetch(
    `/api/products?page=${page}&pageSize=20&isActive=true`
  );
  const result = await response.json();
  return result;
};

const nextPage = async currentPagination => {
  if (currentPagination.hasNextPage) {
    return goToPage(currentPagination.nextPage);
  }
};

const previousPage = async currentPagination => {
  if (currentPagination.hasPreviousPage) {
    return goToPage(currentPagination.previousPage);
  }
};
```

### 3. Componente de Paginación UI

```typescript
interface PaginationProps {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  return (
    <div className="pagination">
      <button
        disabled={!pagination.hasPreviousPage}
        onClick={() => onPageChange(pagination.previousPage!)}
      >
        Anterior
      </button>

      <span>
        Página {pagination.currentPage} de {pagination.totalPages}
        ({pagination.totalItems} registros)
      </span>

      <button
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.nextPage!)}
      >
        Siguiente
      </button>
    </div>
  );
};
```

### 4. Filtros Dinámicos

```typescript
// Hook para manejar filtros y paginación
const useProductList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    isActive: true,
  });

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset a la primera página al cambiar filtros
    }));
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return params.toString();
  };

  return { filters, updateFilter, buildQueryString };
};
```

## Validaciones

- El `page` mínimo es 1
- El `pageSize` mínimo es 1, máximo recomendado 100
- Si se solicita una página mayor a `totalPages`, se retorna la última página disponible
- Todos los filtros son opcionales
- Los filtros de texto (`search`) son case-insensitive

## Rendimiento

- Las consultas están optimizadas con índices en las columnas más utilizadas
- Se recomienda usar filtros específicos cuando sea posible
- La paginación reduce la carga en el servidor y mejora los tiempos de respuesta
- El `search` en facturas busca en múltiples campos simultáneamente

## Notas Adicionales

- Las fechas deben estar en formato ISO 8601 (ej: `2026-01-15T14:30:00Z`)
- Los UUIDs deben ser válidos (formato estándar UUID v4)
- Los valores booleanos se pasan como strings: `'true'` o `'false'`
- Los valores numéricos (precios, páginas) se pasan como strings en query params y se convierten automáticamente
