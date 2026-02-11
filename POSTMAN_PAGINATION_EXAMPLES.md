# Ejemplos de Uso con Postman - Paginación y Filtros

## Configuración de Colección de Postman

### Variables de Entorno Sugeridas

- `baseUrl`: http://localhost:3000 (para local)
- `token`: Tu token de autenticación JWT

## Ejemplos de Productos

### 1. Listar Todos los Productos (Primera Página)

```
GET {{baseUrl}}/api/products?page=1&pageSize=10
```

### 2. Listar Productos Activos

```
GET {{baseUrl}}/api/products?isActive=true&page=1&pageSize=20
```

### 3. Buscar Productos

```
GET {{baseUrl}}/api/products?search=laptop&page=1&pageSize=10
```

### 4. Filtrar por Rango de Precios

```
GET {{baseUrl}}/api/products?minPrice=100&maxPrice=1000&page=1&pageSize=15
```

### 5. Búsqueda Combinada

```
GET {{baseUrl}}/api/products?isActive=true&search=dell&minPrice=500&maxPrice=2000&page=1&pageSize=10
```

### 6. Obtener Segunda Página con 20 Items

```
GET {{baseUrl}}/api/products?page=2&pageSize=20
```

## Ejemplos de Facturas

### 1. Listar Todas las Facturas (Primera Página)

```
GET {{baseUrl}}/api/invoices?page=1&pageSize=10
Headers:
  Authorization: Bearer {{token}}
```

### 2. Filtrar Facturas Pendientes

```
GET {{baseUrl}}/api/invoices?status=PENDING&page=1&pageSize=15
Headers:
  Authorization: Bearer {{token}}
```

### 3. Facturas por Rango de Fechas

```
GET {{baseUrl}}/api/invoices?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z&page=1&pageSize=20
Headers:
  Authorization: Bearer {{token}}
```

### 4. Buscar por Cliente

```
GET {{baseUrl}}/api/invoices?search=Juan&page=1&pageSize=10
Headers:
  Authorization: Bearer {{token}}
```

### 5. Filtrar por Origen y Método de Pago

```
GET {{baseUrl}}/api/invoices?origin=WEB_ORDER&paymentMethod=CASH&page=1&pageSize=10
Headers:
  Authorization: Bearer {{token}}
```

### 6. Filtrar por Ciudad

```
GET {{baseUrl}}/api/invoices?city=Bogotá&page=1&pageSize=15
Headers:
  Authorization: Bearer {{token}}
```

### 7. Búsqueda Avanzada Combinada

```
GET {{baseUrl}}/api/invoices?status=PAID&origin=PHONE_ORDER&city=Medellín&startDate=2026-01-01&page=2&pageSize=25
Headers:
  Authorization: Bearer {{token}}
```

### 8. Facturas de un Usuario Específico

```
GET {{baseUrl}}/api/invoices?createdById=uuid-del-usuario&page=1&pageSize=10
Headers:
  Authorization: Bearer {{token}}
```

## Respuestas Esperadas

### Respuesta Exitosa (200 OK)

```json
{
  "data": [
    {
      "id": "...",
      "code": "...",
      ...
    }
  ],
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

### Sin Resultados (200 OK)

```json
{
  "data": [],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "nextPage": null,
    "previousPage": null
  }
}
```

## Scripts Pre-request en Postman

### Script para Debug de Parámetros

```javascript
// Pre-request Script
const page = pm.variables.get('page') || 1;
const pageSize = pm.variables.get('pageSize') || 10;

console.log(`Requesting page ${page} with ${pageSize} items per page`);
```

### Script para Navegar a Siguiente Página

```javascript
// Tests Script
const response = pm.response.json();
const pagination = response.pagination;

if (pagination.hasNextPage) {
  pm.environment.set('currentPage', pagination.nextPage);
  console.log(`Next page available: ${pagination.nextPage}`);
} else {
  console.log('No more pages available');
}
```

## Tests de Postman

### Validar Estructura de Respuesta Paginada

```javascript
pm.test('Response has pagination structure', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData).to.have.property('pagination');
  pm.expect(jsonData.pagination).to.have.all.keys(
    'currentPage',
    'pageSize',
    'totalItems',
    'totalPages',
    'hasNextPage',
    'hasPreviousPage',
    'nextPage',
    'previousPage'
  );
});

pm.test('Data is an array', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.data).to.be.an('array');
});

pm.test('Page size is respected', function () {
  const jsonData = pm.response.json();
  const pageSize = jsonData.pagination.pageSize;
  pm.expect(jsonData.data.length).to.be.at.most(pageSize);
});

pm.test('Pagination logic is correct', function () {
  const jsonData = pm.response.json();
  const pagination = jsonData.pagination;

  // Verificar que totalPages sea correcto
  const expectedPages = Math.ceil(pagination.totalItems / pagination.pageSize);
  pm.expect(pagination.totalPages).to.equal(expectedPages);

  // Verificar navegación
  if (pagination.currentPage > 1) {
    pm.expect(pagination.hasPreviousPage).to.be.true;
    pm.expect(pagination.previousPage).to.equal(pagination.currentPage - 1);
  } else {
    pm.expect(pagination.hasPreviousPage).to.be.false;
    pm.expect(pagination.previousPage).to.be.null;
  }

  if (pagination.currentPage < pagination.totalPages) {
    pm.expect(pagination.hasNextPage).to.be.true;
    pm.expect(pagination.nextPage).to.equal(pagination.currentPage + 1);
  } else {
    pm.expect(pagination.hasNextPage).to.be.false;
    pm.expect(pagination.nextPage).to.be.null;
  }
});
```

## Consejos para Testing

1. **Empezar con página 1 y pageSize pequeño (5-10)** para ver la paginación funcionando
2. **Crear suficientes registros de prueba** para tener múltiples páginas
3. **Probar casos límite**: página 0, página mayor a totalPages, pageSize muy grande
4. **Verificar filtros**: combinar múltiples filtros y verificar que se apliquen correctamente
5. **Performance**: comparar tiempos de respuesta con y sin paginación

## Automatización de Tests

### Colección de Newman

```bash
# Instalar Newman
npm install -g newman

# Ejecutar colección con paginación
newman run Naste_API.postman_collection.json \
  -e Naste_Local.postman_environment.json \
  --folder "Products - Pagination" \
  --reporters cli,html
```
