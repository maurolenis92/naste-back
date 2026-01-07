# Cómo Usar la Colección de Postman

## 📥 Importar la Colección

1. **Abrir Postman**
2. Click en **Import** (esquina superior izquierda)
3. Arrastra o selecciona los siguientes archivos:
   - `Naste_API.postman_collection.json` - La colección completa
   - `Naste_Local.postman_environment.json` - Variables de entorno

## ⚙️ Configurar el Entorno

1. En Postman, selecciona el entorno **"Naste - Local Development"** en el dropdown superior derecho
2. Click en el ícono de ojo 👁️ junto al dropdown de entornos
3. Click en **Edit** en el entorno "Naste - Local Development"
4. Actualiza las variables:
   - `base_url`: `http://localhost:3000` (ya configurado)
   - `cognito_token`: Pega aquí tu access token de AWS Cognito

### Cómo Obtener el Token de Cognito

**Opción 1: Desde tu aplicación frontend**

- Inicia sesión en tu app
- Abre las DevTools del navegador (F12)
- Ve a Console y ejecuta:
  ```javascript
  // Si usas AWS Amplify
  const session = await Auth.currentSession();
  console.log(session.getAccessToken().getJwtToken());
  ```

**Opción 2: Usando AWS CLI**

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=user@example.com,PASSWORD=yourpassword
```

**Opción 3: Para pruebas, desde AWS Console**

1. Ve a AWS Cognito → User Pools → Tu pool
2. Crea un usuario de prueba
3. Usa un SDK o herramienta para autenticar y obtener el token

## 📚 Estructura de la Colección

### 🏥 Health & Info

- **Health Check** - Verifica que el servidor esté funcionando (sin autenticación)
- **Root Info** - Información básica de la API (sin autenticación)

### 📦 Products

Todos los endpoints requieren autenticación:

- **List Products** - Lista todos los productos (con filtro opcional por `isActive`)
- **Get Product by ID** - Obtiene un producto específico
- **Create Product** - Crea un nuevo producto
- **Update Product** - Actualiza un producto existente
- **Delete Product** - Desactiva un producto (soft delete)

### 🧾 Invoices

Todos los endpoints requieren autenticación:

- **List Invoices** - Lista todas las facturas (con filtros opcionales: status, fechas)
- **Get Invoice by ID** - Obtiene una factura específica con items
- **Create Invoice** - Crea una nueva factura (el `createdById` viene del token)
- **Update Invoice** - Actualiza una factura completa
- **Update Invoice Status** - Cambia solo el estado de la factura
- **Delete Invoice** - Elimina una factura y restaura stock

## 🔐 Autenticación

La colección usa **Bearer Token** authentication de forma automática.

- El token se toma de la variable `{{cognito_token}}`
- Se agrega automáticamente en el header: `Authorization: Bearer {{cognito_token}}`
- Los endpoints de **Health** y **Root** no requieren autenticación

## 🚀 Uso Rápido

### 1️⃣ Verificar que el servidor esté corriendo

```bash
# En tu terminal
cd /path/to/naste-back
npm run dev
```

### 2️⃣ Probar Health Check (sin autenticación)

- Selecciona **Health & Info → Health Check**
- Click en **Send**
- Deberías ver: `{"status": "OK", "service": "naste-api", ...}`

### 3️⃣ Configurar tu token

- Obtén un access token de AWS Cognito
- Pégalo en la variable de entorno `cognito_token`

### 4️⃣ Probar endpoints autenticados

- Selecciona **Products → List Products**
- Click en **Send**
- Si el token es válido, verás la lista de productos

## 📝 Ejemplos de Body

### Crear Producto

```json
{
  "code": "VELA001",
  "description": "Vela aromática de lavanda",
  "price": 25000,
  "stock": 100,
  "imageUrl": "https://example.com/vela001.jpg"
}
```

### Crear Factura

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
      "productId": "uuid-del-producto",
      "description": "Vela aromática de lavanda",
      "quantity": 3,
      "unitPrice": 25000
    }
  ]
}
```

**Nota:** El `productId` en items es opcional. Si se incluye, se validará el stock y se descontará automáticamente.

## 🎯 Valores de Enums

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

## ⚠️ Errores Comunes

### 401 Unauthorized

- **Causa**: Token inválido, expirado o no configurado
- **Solución**: Actualiza la variable `cognito_token` con un token válido

### 404 Not Found

- **Causa**: El ID del recurso no existe
- **Solución**: Verifica que el UUID sea correcto

### 400 Bad Request

- **Causa**: Datos de entrada inválidos
- **Solución**: Revisa el cuerpo de la petición y los tipos de datos

### 409 Conflict

- **Causa**: Código de producto duplicado
- **Solución**: Usa un código único para el producto

## 💡 Tips

1. **Guarda los IDs**: Después de crear un producto o factura, copia el `id` para usarlo en otros requests
2. **Usa variables**: Puedes crear variables de Postman para IDs frecuentes
3. **Collections Runner**: Usa el runner de Postman para ejecutar múltiples requests en secuencia
4. **Environments**: Crea diferentes entornos (Dev, Staging, Production) con diferentes URLs y tokens

## 🔄 Flujo de Prueba Completo

1. **Health Check** → Verificar que el servidor funciona
2. **Create Product** → Crear un producto y guardar su `id`
3. **List Products** → Verificar que se creó correctamente
4. **Create Invoice** → Crear una factura usando el `productId` del paso 2
5. **Get Invoice by ID** → Ver la factura con items
6. **Update Invoice Status** → Cambiar estado a `DELIVERED`
7. **Delete Invoice** → Eliminar y verificar que se restaura el stock

## 📖 Más Información

Ver [API_DOCUMENTATION.md](API_DOCUMENTATION.md) para documentación completa de la API.
