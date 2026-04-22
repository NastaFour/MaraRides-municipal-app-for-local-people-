# Expo Go Monorepo Development Protocol

## 🎯 Objetivo
Este protocolo define el enfoque estricto y seguro para inicializar, actualizar y desarrollar proyectos de React Native usando **Expo Go** dentro de arquitecturas Monorepo, diseñado para evitar el "Dependency Hell" y los errores binarios nativos (Crash por TurboModules y NativeModules).

## 🚨 El Peligro de las Versiones Nativas
A diferencia de las aplicaciones web, **Expo Go es una aplicación nativa pre-compilada** (escrita en C++ y Java/Objective-C). Por lo tanto, incluye versiones **sujetadas y exactas** de librerías base (como React Native, Maps, SQLite).
Forzar versiones manualmente en el `package.json` mediante `npm install nombre_paquete@futuro` rompe el puente de renderizado instantáneamente si C++ no reconoce el código JS.

## 📋 Reglas de Oro para Desarrollo Seguro en Expo

### 1. Nunca Alterar las Versiones Base Manualmente
Jamás debes editar la versión de `react-native`, `react`, o `expo` escribiendo a mano en el `package.json`. Las dependencias internas son gestionadas por el motor de Expo.
Si necesitas actualizar el proyecto, el único mandato seguro es:
```bash
npx expo install --fix
```
Este comando recalcula toda la matriz de dependencias compatible con tu versión de Expo SDK instalada y descarga los binarios perfectos.

### 2. La Plantilla Golden Master
Cuando un proyecto se corrompe por *hoisting* (NPM subiendo dependencias a la raíz equivocada) o una mala migración:
1. Crea un proyecto puro afuera temporalmente: `npx create-expo-app@latest test-app`
2. Copia exactamente la rama de `dependencies` del `test-app/package.json` hacia el `package.json` de nuestra aplicación.
3. Borra la carpeta global de `node_modules` y el `package-lock.json`.
4. Ejecuta `npm install --legacy-peer-deps` para forzar la instalación fresca.

### 3. Las Librerías de Nativos (GPS, Mapas, Sensores)
Si necesitas instalar un hardware local (ej. `react-native-maps`, `expo-location`), utiliza estrictamente la consola de expo, no NPM puro:
```bash
npx expo install react-native-maps expo-location
```
Esto le indica a la ruleta matemática que te busque exactamente la versión tolerada por tu Expo Go actual. Si por accidente NPM instala `react-native-maps 1.27.2` y tu Expo Go esperaba `1.20.1`, ocurrirá el crash: `RNMapsAirModule could not be found`.

### 4. Modo Nueva Arquitectura vs Puente Tradicional
En SDK 54/55, Meta introdujo el "Bridgeless Mode" o Nueva Arquitectura, pero muchas librerías de terceros continúan dependiendo de arquitecturas pasadas, provocando errores del tipo `PlatformConstants could not be found`.
- Si esto ocurre en Expo Go: apaga la característica en tu `app.json` forzando viejo comportamiento, o bien compila una build nativa en tu celular en vez de usar Expo Go.

### 5. Configuración de Red LAN (Cortafuegos)
En Windows, Expo transmitirá el código fuente usando tu IP de red local (ej: `192.168.x.x:8081`).
- Si utilizas `EXPO_OFFLINE=1`, no se creará un túnel `Ngrok`.
- Si el cortafuegos de Windows está en modo "Público", tu Smartphone recibirá el error `java.io.IOException` o `Network Request Failed`.
- **Solución:** Cambiar el perfil de Red de Windows a "Privado" o inhabilitar el FireWall temporalmente al trabajar localmente en la red interna.

---
**Nota Continua:** Expo Go es excelente para diseño UI rápido.  Al llegar a la etapa de conexión en hardware profundo (Bluetooth, Tareas de fondo complejas), la mejor vía a futuro siempre será escalar a "Development Builds" nativas: `npx expo run:android`.
