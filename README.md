
# 🌱 Sistema de Invernadero Inteligente

Un sistema completo de monitoreo y control para invernaderos desarrollado con React, Express.js y TypeScript. Permite monitorear sensores en tiempo real, controlar sistemas de riego y ventilación, y visualizar datos históricos del clima.

## 📋 Características

- **Monitoreo en Tiempo Real**: Temperatura, humedad, nivel de agua, y luz
- **Control Automático**: Sistemas de riego, ventilación y calefacción
- **Integración Arduino**: Soporte para sensores físicos vía puerto serie
- **API Meteorológica**: Datos del clima exterior desde Open-Meteo
- **Dashboard Interactivo**: Gráficos, alertas y controles manuales
- **WebSockets**: Actualizaciones en tiempo real sin recargar la página
- **Base de Datos**: Almacenamiento persistente con PostgreSQL

## 🚀 Inicio Rápido

### Prerrequisitos

Este proyecto está configurado para ejecutarse en **Replit** y no requiere instalación manual de dependencias.

### Instalación y Configuración

1. **Clonar o importar el proyecto** en Replit

2. **Configurar variables de entorno**
   - El proyecto incluye un archivo `.env` con la configuración básica
   - Si necesitas una API key específica para el clima, agrégala en Secrets

3. **Instalar dependencias** (automático en Replit)
   ```bash
   npm install
   ```

### Lanzamiento del Proyecto

#### Opción 1: Usando el botón Run (Recomendado)
- Simplemente haz clic en el botón **"Run"** en la parte superior
- Esto ejecutará automáticamente `npm run dev`

#### Opción 2: Comando manual
```bash
npm run dev
```

### Acceso a la Aplicación

- **URL de desarrollo**: `https://[tu-repl-name].[tu-username].repl.co`
- **Puerto local**: 5000
- La aplicación se abrirá automáticamente en el navegador integrado de Replit

## 🏗️ Estructura del Proyecto

```
invernadero-inteligente/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Hooks personalizados
│   │   └── lib/           # Utilidades y tipos
├── server/                # Backend Express.js
│   ├── arduino-serial.ts  # Integración con Arduino
│   ├── weather-api.ts     # API del clima
│   ├── routes.ts          # Rutas de la API
│   └── storage.ts         # Manejo de base de datos
├── shared/                # Código compartido
│   └── schema.ts          # Esquemas de base de datos
└── arduino-integration-guide.md  # Guía de Arduino
```

## 🔧 Configuración Detallada

### Base de Datos

El proyecto usa **PostgreSQL** a través de Neon Database:

1. La base de datos se configura automáticamente en Replit
2. Las migraciones se ejecutan automáticamente al iniciar
3. Los datos se persisten entre reinicios

### API del Clima

Configurada para obtener datos de **Córdoba, Argentina**:

- **Proveedor**: Open-Meteo (gratuito, sin API key)
- **Ubicación**: Córdoba (-31.4201, -64.1888)
- **Actualización**: Cada 10 minutos
- **Datos**: Temperatura, humedad, velocidad del viento

### Integración Arduino (Opcional)

Para conectar sensores físicos:

1. Consulta `arduino-integration-guide.md` para el código del Arduino
2. Conecta el Arduino vía USB
3. El sistema detectará automáticamente el puerto serie
4. Si no hay Arduino conectado, usa datos simulados

## 📱 Uso de la Aplicación

### Dashboard Principal
- **Métricas en tiempo real**: Temperatura, humedad, nivel de agua, luz
- **Gráficos históricos**: Evolución de los datos en el tiempo
- **Estado del sistema**: Conexión Arduino, alertas activas
- **Controles manuales**: Riego, ventilación, calefacción

### Páginas Especializadas
- **Temperatura**: Monitoreo térmico detallado
- **Humedad**: Control de humedad ambiental y del suelo
- **Iluminación**: Niveles de luz y horarios
- **Riego**: Programación y control de irrigación
- **Ventilación**: Gestión del flujo de aire
- **Alertas**: Notificaciones del sistema
- **Historial**: Datos históricos y reportes
- **Configuración**: Ajustes del sistema

## 🛠️ Comandos Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Construcción para producción
npm run build

# Ejecutar en producción
npm start

# Verificar tipos TypeScript
npm run check

# Migrar base de datos
npm run db:push
```

## 🔍 Solución de Problemas

### Problema: Arduino no se conecta
- **Síntoma**: "Arduino not connected, starting data simulation"
- **Solución**: El sistema funciona con datos simulados. Para Arduino real, consulta la guía de integración

### Problema: Error de base de datos
- **Síntoma**: Errores de conexión a la DB
- **Solución**: Reinicia el proyecto. La base de datos se reconfigura automáticamente

### Problema: API del clima no responde
- **Síntoma**: Datos meteorológicos desactualizados
- **Solución**: Verifica la conexión a internet. La API se reintenta automáticamente

### Problema: WebSocket desconectado
- **Síntoma**: Datos no se actualizan en tiempo real
- **Solución**: Recarga la página. Las conexiones se reestablecen automáticamente

## 🚀 Despliegue en Producción

### En Replit (Recomendado)

1. **Usar Deployments de Replit**:
   - Ve a la pestaña "Deployments"
   - Selecciona "Autoscale Deployment"
   - Configura los comandos de build y run (ya preconfigurados)
   - Haz clic en "Deploy"

2. **Configuración automática**:
   - Build: `npm run build`
   - Run: `npm start`
   - Puerto: 5000

## 📊 Monitoreo y Logs

### Logs del Sistema
- Los logs se muestran en la consola de Replit
- Incluyen requests HTTP, actualizaciones de sensores, y errores
- Formato: `[TIMESTAMP] [COMPONENT] MESSAGE`

### Métricas Disponibles
- Datos de sensores cada 30 segundos
- Actualizaciones meteorológicas cada 10 minutos
- Actividad del sistema en tiempo real
- Historial completo en base de datos

## 🤝 Contribución

1. Haz fork del proyecto en Replit
2. Crea una rama para tu feature: `git checkout -b mi-feature`
3. Realiza tus cambios y pruébelos
4. Haz commit: `git commit -m "Agregar mi feature"`
5. Haz push: `git push origin mi-feature`
6. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Documentación técnica**: Ver archivos en `/docs`
- **Guía Arduino**: `arduino-integration-guide.md`
- **Issues**: Reporta problemas en el repositorio

## 🔄 Actualizaciones

### Versión Actual: 1.0.0

- ✅ Sistema completo de monitoreo
- ✅ Integración Arduino
- ✅ API meteorológica para Córdoba
- ✅ Dashboard interactivo
- ✅ Base de datos persistente
- ✅ WebSockets en tiempo real

---

**¡Tu invernadero inteligente está listo para usar! 🌱**

Para empezar, simplemente haz clic en **Run** y accede al dashboard desde tu navegador.
