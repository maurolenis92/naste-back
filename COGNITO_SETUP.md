# Configuración de AWS Cognito

Esta guía explica cómo configurar AWS Cognito para autenticación en Naste Backend.

## Paso 1: Crear User Pool en AWS Cognito

1. Ir a [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click en "Create user pool"
3. **Sign-in experience:**
   - Provider types: Cognito user pool
   - Sign-in options: Email (recomendado)
4. **Security requirements:**
   - Password policy: Cognito defaults (o personalizar)
   - Multi-factor authentication: Optional (recomendado: OFF para desarrollo)
5. **Sign-up experience:**
   - Self-registration: Enabled
   - Required attributes: name, email
6. **Message delivery:**
   - Email: Send email with Cognito (para desarrollo)
   - Para producción: Configure SES
7. **Integrate your app:**
   - User pool name: `naste-users` (o el nombre que prefieras)
   - App client name: `naste-backend`
   - **Importante:** Client secret: NO GENERAR (sin secret para aplicaciones públicas)
   - Auth flows: ALLOW_REFRESH_TOKEN_AUTH, ALLOW_USER_PASSWORD_AUTH
8. Revisar y crear

## Paso 2: Obtener credenciales

Después de crear el User Pool:

1. **User Pool ID:**
   - En la página del User Pool, copiar el "User Pool ID"
   - Ejemplo: `us-east-1_ABC123XYZ`

2. **App Client ID:**
   - Ir a "App integration" → "App clients"
   - Copiar el "Client ID"
   - Ejemplo: `1234567890abcdefghijklmnop`

3. **Region:**
   - La región donde creaste el User Pool
   - Ejemplo: `us-east-1`

## Paso 3: Configurar variables de entorno

Editar el archivo `.env` en el proyecto:

```env
COGNITO_USER_POOL_ID=us-east-1_ABC123XYZ
COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
COGNITO_REGION=us-east-1
```

## Paso 4: Probar la autenticación

### Crear un usuario de prueba:

**Opción 1: AWS Console**

1. Ir a tu User Pool → "Users"
2. Click "Create user"
3. Ingresar email y contraseña temporal
4. El usuario deberá cambiar la contraseña en el primer login

**Opción 2: AWS CLI**

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_ABC123XYZ \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=name,Value="Test User" \
  --temporary-password TempPassword123!
```

### Obtener token de acceso:

**Usando AWS CLI:**

```bash
# Iniciar sesión
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 1234567890abcdefghijklmnop \
  --auth-parameters USERNAME=test@example.com,PASSWORD=YourPassword123!

# El response incluirá AccessToken, IdToken y RefreshToken
```

**Usando Postman/Insomnia:**

```
POST https://cognito-idp.{region}.amazonaws.com/
Headers:
  X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
  Content-Type: application/x-amz-json-1.1

Body:
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "your-client-id",
  "AuthParameters": {
    "USERNAME": "test@example.com",
    "PASSWORD": "YourPassword123!"
  }
}
```

### Probar con el backend:

```bash
# Hacer request a endpoint protegido
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <access-token-aquí>"
```

## Estructura del Access Token

El access token de Cognito contiene:

```json
{
  "sub": "uuid-del-usuario-en-cognito",
  "email": "test@example.com",
  "name": "Test User",
  "token_use": "access",
  "auth_time": 1234567890,
  "exp": 1234571490,
  ...
}
```

El middleware extrae:

- `sub` → `cognitoId` (usado como identificador único)
- `email` → email del usuario
- `name` → nombre del usuario (opcional)

## Troubleshooting

### Error: "Missing or invalid authorization header"

- Verificar que el header sea: `Authorization: Bearer <token>`
- Verificar que el token no tenga espacios adicionales

### Error: "Invalid or expired token"

- El token de acceso expira después de 1 hora (por defecto)
- Usar el refresh token para obtener uno nuevo
- Verificar que las credenciales en `.env` sean correctas

### Usuario no se crea automáticamente

- Verificar que el middleware `authMiddleware` esté aplicado
- Revisar logs del servidor para ver errores
- Verificar que la base de datos esté conectada

## Configuración para Producción

1. **Usar Amazon SES para emails:**
   - Configurar Amazon SES
   - Verificar dominio de emails
   - Actualizar User Pool para usar SES

2. **Habilitar MFA (Multi-Factor Auth):**
   - Ir a User Pool → Sign-in experience → MFA
   - Configurar SMS o TOTP

3. **Configurar dominio personalizado:**
   - User Pool → App integration → Domain
   - Configurar dominio personalizado (requiere certificado SSL)

4. **Advanced security features:**
   - Habilitar "Advanced security" para detección de riesgos
   - Configurar respuestas automáticas a actividades sospechosas

5. **Lambda triggers:**
   - Pre sign-up: Validar emails permitidos
   - Post confirmation: Enviar email de bienvenida
   - Pre token generation: Agregar claims personalizados

## Recursos Adicionales

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [aws-jwt-verify Documentation](https://github.com/awslabs/aws-jwt-verify)
- [Cognito User Pool Auth Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
