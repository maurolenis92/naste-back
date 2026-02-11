# 🚀 Guía de Uso - Colección Postman Naste API (Con Paginación)

## 📥 Importar la Colección

1. Abrir Postman
2. Click en **Import**
3. Seleccionar `Naste_API.postman_collection.json`
4. Importar el environment `Naste_Local.postman_environment.json`

## ⚙️ Configurar Variables

### Variables de Environment (Naste_Local.postman_environment.json)

```json
{
  "base_url": "http://localhost:3000",
  "cognito_token": "tu-token-jwt-aqui"
}
```

### Variables de Colección (Nuevas)

La colección incluye variables adicionales para facilitar las pruebas de paginación:

- `current_page`: Página actual (default: 1)
- `page_size`: Tamaño de página (default: 10)

## 🔐 Autenticación

Todas las rutas bajo `/api/*` requieren autenticación JWT de AWS Cognito, excepto:

- `GET /health`
- `GET /`

## 🆕 Nuevas Características: Paginación y Filtros

### 📦 Endpoints de Productos

#### 1. List Products (Paginated) ⭐ NUEVO

Lista productos con paginación y todos los filtros disponibles.

**Parámetros:**

- `page` (default: 1) - Número de página
- `pageSize` (default: 10) - Items por página
- `isActive` (true/false) - Filtrar activos/inactivos
- `search` - Buscar en código o descripción
- `minPrice` - Precio mínimo
- `maxPrice` - Precio máximo

**Tests automáticos incluidos:**

- ✅ Valida estructura de paginación
- ✅ Verifica lógica de navegación
- ✅ Valida pageSize

#### 2. Search Products ⭐ NUEVO

```
GET {{base_url}}/api/products?search=vela&page=1&pageSize=20
```

#### 3. Filter Products by Price Range ⭐ NUEVO

```
GET {{base_url}}/api/products?minPrice=10000&maxPrice=50000&isActive=true
```

### 🧾 Endpoints de Facturas

#### 1. List Invoices (Paginated) ⭐ NUEVO

**Parámetros:**

- `page`, `pageSize` - Paginación
- `status` - PENDING | PAID | DELIVERED | CANCELLED
- `search` - Buscar en cliente, documento, dirección
- `origin` - STORE | PHONE_ORDER | WEB_ORDER
- `paymentMethod` - CASH | CARD | TRANSFER | NEQUI | DAVIPLATA
- `city` - Filtrar por ciudad
- `startDate`, `endDate` - Rango de fechas
- `createdById` - UUID del usuario

**Tests automáticos incluidos:**

- ✅ Valida estructura completa
- ✅ Verifica relaciones (items, createdBy)

#### 2. Filter Invoices by Status ⭐ NUEVO

```
GET {{base_url}}/api/invoices?status=PENDING&page=1&pageSize=15
```

#### 3. Filter Invoices by Date Range ⭐ NUEVO

```
GET {{base_url}}/api/invoices?startDate=2026-01-01&endDate=2026-01-31
```

#### 4. Search Invoices by Customer ⭐ NUEVO

```
GET {{base_url}}/api/invoices?search=Juan&page=1&pageSize=10
```

#### 5. Filter Invoices - Advanced ⭐ NUEVO

Combina múltiples filtros:

```
GET {{base_url}}/api/invoices?status=PAID&origin=WEB_ORDER&paymentMethod=TRANSFER&city=Bogotá
```

## 📊 Formato de Respuesta Paginada

```json
{
  "data": [
    // ... array de recursos
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

## 🧪 Tests Automatizados

### Ejecutar en Postman UI

1. **Request individual:** Abrir request → Send → Ver "Test Results"
2. **Carpeta completa:** Click derecho en "Products" → "Run folder"
3. **Colección completa:** Click en colección → "Run"

### Ejecutar con Newman (CLI)

```bash
# Instalar Newman
npm install -g newman

# Ejecutar colección completa
newman run Naste_API.postman_collection.json \
  -e Naste_Local.postman_environment.json

# Solo productos con paginación
newman run Naste_API.postman_collection.json \
  -e Naste_Local.postman_environment.json \
  --folder "Products"

# Con reporte HTML
newman run Naste_API.postman_collection.json \
  -e Naste_Local.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export report.html
```

## 🔄 Navegación de Páginas

### Script para Próxima Página

Agregar en tab "Tests":

```javascript
const response = pm.response.json();
const pagination = response.pagination;

if (pagination.hasNextPage) {
  pm.collectionVariables.set('current_page', pagination.nextPage);
  console.log(`✅ Próxima página: ${pagination.nextPage}`);
} else {
  console.log('⚠️ No hay más páginas');
}
```

### Script para Página Anterior

```javascript
const response = pm.response.json();
const pagination = response.pagination;

if (pagination.hasPreviousPage) {
  pm.collectionVariables.set('current_page', pagination.previousPage);
  console.log(`✅ Página anterior: ${pagination.previousPage}`);
}
```

## 💡 Ejemplos de Uso Común

### 1. Buscar producto específico

```
GET /api/products?search=VELA001&pageSize=5
```

### 2. Productos activos con bajo precio

```
GET /api/products?isActive=true&maxPrice=30000&pageSize=20
```

### 3. Facturas del mes actual

```
GET /api/invoices?startDate=2026-02-01&endDate=2026-02-29&pageSize=50
```

### 4. Facturas pendientes por ciudad

```
GET /api/invoices?status=PENDING&city=Bogotá&page=1&pageSize=20
```

### 5. Búsqueda por cliente con paginación grande

```
GET /api/invoices?search=María&pageSize=100
```

## 📋 Comparación: Antes vs Ahora

### Antes (Sin Paginación)

```json
GET /api/products?isActive=true

Response:
[
  { ... }, // todos los productos
  { ... },
  // ... potencialmente cientos
]
```

### Ahora (Con Paginación)

```json
GET /api/products?isActive=true&page=1&pageSize=10

Response:
{
  "data": [
    { ... }, // solo 10 productos
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 150,
    "totalPages": 15,
    // ... metadata completa
  }
}
```

## 🎯 Mejores Prácticas

### 1. Tamaño de Página

- **Móvil/Tests:** 10-15 items
- **Desktop/Normal:** 20-50 items
- **Exportación:** 100 items máximo

### 2. Filtros Combinados

```
✅ Bueno: ?status=PAID&city=Bogotá&page=1&pageSize=20
❌ Evitar: ?pageSize=1000 (sobrecarga)
```

### 3. Búsqueda de Texto

```
✅ search=Juan (case-insensitive, busca en múltiples campos)
✅ search=123456 (busca en códigos y documentos)
```

### 4. Fechas

```
✅ Recomendado: 2026-01-15
✅ También válido: 2026-01-15T00:00:00Z
```

## 🐛 Troubleshooting

### Error 401 - Unauthorized

- ✅ Verificar que `cognito_token` esté actualizado
- ✅ Token no expirado (< 1 hora usualmente)
- ✅ Environment "Naste Local" seleccionado

### Error 400 - Bad Request

- ✅ Verificar formato de UUIDs
- ✅ Fechas en formato correcto
- ✅ Valores de enum válidos

### Respuesta con data: []

- ✅ Normal si no hay registros
- ✅ Revisar filtros (pueden ser muy restrictivos)
- ✅ Verificar datos de prueba en BD

### Tests Fallando

- ✅ Servidor corriendo en puerto 3000
- ✅ Base de datos con datos de prueba
- ✅ Parámetros válidos

## 📚 Recursos Adicionales

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación completa
- **[PAGINATION_AND_FILTERS.md](./PAGINATION_AND_FILTERS.md)** - Guía detallada de paginación
- **[POSTMAN_PAGINATION_EXAMPLES.md](./POSTMAN_PAGINATION_EXAMPLES.md)** - Más ejemplos

## 🎉 ¿Qué Cambió?

### Endpoints Nuevos Agregados

- ✅ List Products (Paginated)
- ✅ Search Products
- ✅ Filter Products by Price Range
- ✅ List Invoices (Paginated)
- ✅ Filter Invoices by Status
- ✅ Filter Invoices by Date Range
- ✅ Search Invoices by Customer
- ✅ Filter Invoices - Advanced

### Tests Automáticos Agregados

- ✅ Validación de estructura de paginación
- ✅ Validación de lógica de navegación
- ✅ Validación de metadata
- ✅ Validación de relaciones

### Variables Nuevas

- ✅ `current_page` - Para navegación fácil
- ✅ `page_size` - Tamaño predeterminado

---

**Última actualización:** Febrero 2026
**Versión:** 2.0 con Paginación
