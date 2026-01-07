# Naste Backend - Sistema de Facturación e Inventario

Backend completo construido con Node.js, Express, TypeScript, Prisma ORM y PostgreSQL.

## Stack Tecnológico

- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Zod** para validaciones
- **AWS Cognito** para autenticación JWT
- Arquitectura: Controllers/Services/Routes

## Estructura del Proyecto

```
src/
├── controllers/        # Controladores (manejan req/res)
├── services/          # Lógica de negocio
├── routes/            # Definición de rutas
├── schemas/           # Validaciones con Zod
├── middlewares/       # Middlewares personalizados
├── types/             # Tipos de TypeScript
├── utils/             # Utilidades (Prisma client)
└── index.ts          # Punto de entrada
```

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con:
# - DATABASE_URL
# - COGNITO_USER_POOL_ID
# - COGNITO_CLIENT_ID
# - COGNITO_REGION

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en desarrollo
npm run dev
```

## Autenticación

Todas las rutas bajo `/api/*` están protegidas con autenticación JWT de AWS Cognito.

### Header requerido:

```
Authorization: Bearer <cognito_access_token>
```

### Flujo de autenticación:

1. El cliente obtiene un access token de AWS Cognito
2. Incluye el token en el header `Authorization`
3. El middleware `authMiddleware` verifica el token
4. Si es válido, extrae `cognitoId`, `email` y `name` del token
5. Auto-provisioning: Si el usuario no existe en la DB, se crea automáticamente
6. La información del usuario se agrega a `req.user`

### Rutas sin autenticación:

- `GET /health` - Health check
- `GET /` - Root endpoint

### Respuesta de error de autenticación (401):

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

## API Endpoints

### Products

#### GET `/api/products`

Lista todos los productos.

**Query params:**

- `isActive` (boolean, opcional): Filtrar por estado activo

**Response:**

```json
[
  {
    "id": "uuid",
    "code": "PROD001",
    "description": "Producto ejemplo",
    "price": 25000,
    "stock": 100,
    "imageUrl": "https://...",
    "isActive": true,
    "createdAt": "2026-01-06T...",
    "updatedAt": "2026-01-06T..."
  }
]
```

#### GET `/api/products/:id`

Obtiene un producto por ID.

**Response:**

```json
{
  "id": "uuid",
  "code": "PROD001",
  "description": "Producto ejemplo",
  "price": 25000,
  "stock": 100,
  "imageUrl": "https://...",
  "isActive": true,
  "createdAt": "2026-01-06T...",
  "updatedAt": "2026-01-06T..."
}
```

#### POST `/api/products`

Crea un nuevo producto.

**Body:**

```json
{
  "code": "PROD001",
  "description": "Producto ejemplo",
  "price": 25000,
  "stock": 100,
  "imageUrl": "https://..." // opcional
}
```

#### PUT `/api/products/:id`

Actualiza un producto existente.

**Body:** (todos los campos opcionales)

```json
{
  "code": "PROD001",
  "description": "Producto actualizado",
  "price": 30000,
  "stock": 150,
  "imageUrl": "https://...",
  "isActive": true
}
```

#### DELETE `/api/products/:id`

Desactiva un producto (soft delete).

**Response:**

```json
{
  "id": "uuid",
  "isActive": false,
  ...
}
```

---

### Invoices

#### GET `/api/invoices`

Lista todas las facturas.

**Query params:**

- `status` (InvoiceStatus, opcional): PENDING | PAID | DELIVERED | CANCELLED
- `startDate` (datetime, opcional): Fecha inicio
- `endDate` (datetime, opcional): Fecha fin
- `createdById` (uuid, opcional): Filtrar por usuario creador

**Response:**

```json
[
  {
    "id": "uuid",
    "status": "PENDING",
    "origin": "INSTAGRAM",
    "paymentMethod": "TRANSFER",
    "customerName": "Juan Pérez",
    "customerIdDoc": "123456789",
    "customerPhone": "+57300123456",
    "customerEmail": "juan@example.com",
    "city": "Bogotá",
    "neighborhood": "Chapinero",
    "address": "Calle 123 #45-67",
    "total": 75000,
    "invoiceDate": "2026-01-06T...",
    "deliveryDate": "2026-01-08T...",
    "items": [...],
    "createdBy": {
      "id": "uuid",
      "name": "Admin",
      "email": "admin@naste.com"
    },
    "createdAt": "2026-01-06T...",
    "updatedAt": "2026-01-06T..."
  }
]
```

#### GET `/api/invoices/:id`

Obtiene una factura por ID (incluye items y productos).

#### POST `/api/invoices`

Crea una nueva factura.

**Body:**

```json
{
  "status": "PENDING",
  "origin": "INSTAGRAM",
  "paymentMethod": "TRANSFER",
  "customerName": "Juan Pérez",
  "customerIdDoc": "123456789",
  "customerPhone": "+57300123456",
  "customerEmail": "juan@example.com",
  "city": "Bogotá",
  "neighborhood": "Chapinero",
  "address": "Calle 123 #45-67",
  "deliveryDate": "2026-01-08T00:00:00Z",
  "items": [
    {
      "productId": "uuid", // opcional, si viene de catálogo
      "description": "Vela aromática",
      "quantity": 3,
      "unitPrice": 25000
    }
  ]
}
```

**Nota:** El `createdById` se obtiene automáticamente del usuario autenticado (token JWT).

**Comportamiento:**

- Calcula automáticamente el `subtotal` de cada item (quantity × unitPrice)
- Calcula automáticamente el `total` de la factura
- Si el item tiene `productId`, descuenta el stock del producto
- Valida que haya stock suficiente antes de crear la factura

#### PUT `/api/invoices/:id`

Actualiza una factura completa.

**Body:** Similar a POST, todos los campos opcionales excepto si se envían `items` (debe incluir al menos uno)

**Comportamiento:**

- Si se actualizan los `items`, restaura el stock de los items anteriores y descuenta el de los nuevos
- Recalcula el total automáticamente

#### PATCH `/api/invoices/:id/status`

Cambia solo el estado de la factura.

**Body:**

```json
{
  "status": "DELIVERED"
}
```

**Comportamiento:**

- Si se cancela una factura (status: CANCELLED), restaura el stock de los productos

#### DELETE `/api/invoices/:id`

Elimina una factura.

**Comportamiento:**

- Restaura el stock de todos los productos asociados
- Elimina la factura y sus items en cascada

---

## Enums

### InvoiceStatus

- `PENDING` - Pendiente
- `PAID` - Pagada
- `DELIVERED` - Entregada
- `CANCELLED` - Cancelada

### InvoiceOrigin

- `INSTAGRAM`
- `FACEBOOK`
- `TIKTOK`
- `WHATSAPP`
- `REFERRAL`
- `OTHER`

### PaymentMethod

- `CASH` - Efectivo
- `TRANSFER` - Transferencia
- `BREB`
- `NEQUI`
- `BANCOLOMBIA`
- `OTHER`

---

## Manejo de Errores

Todos los endpoints retornan errores en el siguiente formato:

### Errores de validación (400)

```json
{
  "error": "Validation error",
  "details": [
    {
      "path": "body.price",
      "message": "Price must be positive"
    }
  ]
}
```

### Errores de registro duplicado (409)

```json
{
  "error": "Duplicate entry",
  "field": ["code"]
}
```

### Errores de registro no encontrado (404)

```json
{
  "error": "Product not found"
}
```

### Errores de negocio (400)

```json
{
  "error": "Insufficient stock for product PROD001. Available: 10"
}
```

### Errores internos (500)

```json
{
  "error": "Internal server error",
  "message": "..." // solo en desarrollo
}
```

---

## Autenticación y Auto-provisioning

### Flujo completo:

1. **Cliente** obtiene access token de AWS Cognito
2. **Cliente** envía request con header: `Authorization: Bearer <token>`
3. **authMiddleware** verifica el token con AWS Cognito
4. **authMiddleware** extrae `cognitoId`, `email` y `name` del token
5. **authMiddleware** llama a `userService.getOrCreateUser()`:
   - Si el usuario existe (por cognitoId), lo retorna
   - Si no existe, lo crea en la DB automáticamente
6. **authMiddleware** agrega `req.user` con la información del usuario
7. **Controller** usa `req.user.cognitoId` para obtener el `userId` de la DB

### Ejemplo de uso en servicios:

```typescript
// En invoice.controller.ts
const cognitoId = req.user!.cognitoId;
const invoice = await invoiceService.createInvoice(req.body, cognitoId);

// En invoice.service.ts
async createInvoice(data: CreateInvoiceInput, cognitoId: string) {
  // Obtener usuario por cognitoId
  const user = await prisma.user.findUnique({
    where: { cognitoId },
  });

  // Usar user.id como createdById
  const invoice = await prisma.invoice.create({
    data: {
      createdById: user.id,
      // ... resto de datos
    },
  });
}
```

---

## Scripts

```bash
# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Formatear código con Prettier
npm run format

# Verificar formato
npm run format:check

# Prisma Studio (GUI para base de datos)
npx prisma studio

# Generar cliente Prisma después de cambios en schema
npx prisma generate

# Crear y aplicar migración
npx prisma migrate dev --name nombre_migracion
```

---

## Características Implementadas

✅ CRUD completo de productos  
✅ CRUD completo de facturas  
✅ Gestión automática de inventario (descuento/restauración de stock)  
✅ Cálculo automático de totales en facturas  
✅ Validación de datos con Zod  
✅ Manejo centralizado de errores  
✅ User auto-provisioning  
✅ Soft delete en productos  
✅ Filtros en listados (productos e facturas)  
✅ Tipos estrictos de TypeScript  
✅ Arquitectura escalable (Controllers/Services/Routes)  
✅ Autenticación JWT con AWS Cognito  
✅ Auto-creación de usuarios en primera autenticación

---

## Próximos Pasos Sugeridos

- [ ] Agregar paginación a los listados
- [ ] Implementar reportes y estadísticas
- [ ] Agregar logs con Winston
- [ ] Implementar tests unitarios e integración
- [ ] Agregar documentación Swagger/OpenAPI
- [ ] Implementar cache con Redis
- [ ] Agregar rate limiting
- [ ] Implementar RBAC (roles y permisos)
