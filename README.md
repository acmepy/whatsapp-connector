# whatsapp-connector

Libreria Node.js reutilizable para crear y administrar sesiones de WhatsApp mediante adapters. Incluye un adapter basado en [`whatsapp-web.js`](https://wwebjs.dev/) y una API normalizada para enviar mensajes, escuchar eventos y consultar informacion de sesiones.

## Caracteristicas

- Multiples sesiones activas identificadas por `sessionId`.
- Adapter por defecto para `whatsapp-web.js`.
- API unificada para texto, media, documentos, audio, imagenes, ubicaciones y reacciones.
- Eventos normalizados por sesion y tambien publicados en un `EventBus` global.
- Tipos TypeScript incluidos en `types/index.d.ts`.
- Tests con el runner nativo de Node.js.

## Requisitos

- Node.js con soporte para ES modules y `node --test`.
- Dependencias instaladas con `npm install`.
- Para usar el adapter real, `whatsapp-web.js` inicializa un cliente web de WhatsApp mediante Puppeteer/Chromium.

## Instalacion

```bash
npm install
```

## Uso Basico

```js
import { WhatsAppConnector } from 'whatsapp-connector';

const connector = new WhatsAppConnector({
  dataPath: './sessions',
  puppeteer: {
    headless: true
  }
});

const session = await connector.createSession('empresa-1');

session.on('qr.received', (event) => {
  console.log('Escanea este QR:', event.payload);
});

session.on('session.ready', async () => {
  await session.sendText('595981123456', 'Hola desde whatsapp-connector');
});

session.on('message.received', (event) => {
  console.log('Mensaje recibido:', event.payload.body);
});
```

`createSession()` inicia el adapter en el siguiente tick, para que puedas registrar listeners inmediatamente despues de crear la sesion y capturar eventos como `qr.received`.

## API Principal

### `WhatsAppConnector`

```js
const connector = new WhatsAppConnector(options);
```

Metodos disponibles:

- `createSession(sessionId, options)`: crea e inicializa una sesion.
- `getSession(sessionId)`: obtiene una sesion activa.
- `listSessions()`: lista todas las sesiones activas.
- `removeSession(sessionId)`: destruye y elimina una sesion.
- `destroy()`: destruye todas las sesiones.
- `registerAdapter(name, adapter)`: registra un adapter personalizado.

El adapter por defecto es `wwebjs`. Tambien se puede indicar explicitamente:

```js
await connector.createSession('empresa-1', {
  adapter: 'wwebjs',
  dataPath: './sessions'
});
```

### `WhatsAppSession`

Una sesion permite enviar mensajes, consultar estado y manejar su ciclo de vida.

```js
await session.sendText('595981123456', 'Hola');

await session.sendImage('595981123456', './foto.jpg', {
  caption: 'Imagen adjunta'
});

await session.sendPdf('595981123456', './archivo.pdf', {
  filename: 'archivo.pdf'
});

await session.sendLocation('595981123456', {
  latitude: -25.30066,
  longitude: -57.63591,
  description: 'Oficina Central'
});

await session.reactToMessage('message-id', 'ok');
```

Metodos de envio:

- `sendText(to, message, options)`
- `sendMedia(to, media, options)`
- `sendPdf(to, file, options)`
- `sendImage(to, file, options)`
- `sendAudio(to, file, options)`
- `sendDocument(to, file, options)`
- `sendLocation(to, location, options)`
- `reactToMessage(messageId, reaction)`

Metodos de sesion:

- `getInfo()`
- `getState()`
- `restart()`
- `destroy()`

Consultas opcionales, segun soporte del adapter:

- `listMessages(options)`
- `getMessage(messageId)`
- `getContact(phone)`
- `getContacts(options)`
- `getProfilePicture(phone)`

## Estados

Una sesion puede pasar por estos estados:

- `initializing`
- `qr`
- `authenticated`
- `ready`
- `disconnected`
- `destroyed`
- `failed`

Los metodos de envio y consulta requieren que la sesion este en estado `ready`; si no lo esta, se lanza `SessionNotReadyError`.

## Eventos

Los eventos se emiten en la sesion y tambien en el `EventBus` global.

```js
import { EventBus } from 'whatsapp-connector';

EventBus.on('message.received', (event) => {
  console.log(event.sessionId, event.payload);
});
```

Formato normalizado:

```js
{
  sessionId: 'empresa-1',
  adapter: 'wwebjs',
  timestamp: 1710000000000,
  payload: {}
}
```

Eventos principales:

- `qr.received`
- `session.state.changed`
- `session.authenticated`
- `session.ready`
- `session.disconnected`
- `session.failed`
- `session.error`
- `adapter.error`
- `message.received`
- `message.sent`
- `message.ack`
- `message.revoked`
- `message.reaction`
- `chat.updated`
- `contact.updated`
- `group.join`
- `group.leave`

## Adapter `wwebjs`

El adapter incluido usa `whatsapp-web.js` y guarda la autenticacion local en `./sessions/<sessionId>/` por defecto.

Opciones comunes:

```js
const connector = new WhatsAppConnector({
  dataPath: './sessions',
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  wwebjs: {
    // Opciones nativas de whatsapp-web.js Client
  }
});
```

Los numeros se normalizan antes de enviarse al cliente de WhatsApp. Podes pasar valores como `595981123456` y el adapter los convierte al formato JID requerido por `whatsapp-web.js`.

## Adapter Personalizado

Un adapter debe exponer una factory `createSession(sessionId, options)` que devuelva una instancia compatible con `BaseAdapter`.

```js
import { WhatsAppConnector } from 'whatsapp-connector';
import { MyAdapter } from './MyAdapter.js';

const connector = new WhatsAppConnector();

connector.registerAdapter('my-adapter', {
  createSession(sessionId, options) {
    return new MyAdapter(sessionId, options);
  }
});

const session = await connector.createSession('empresa-1', {
  adapter: 'my-adapter'
});
```

## Errores

La libreria exporta errores especificos para manejar casos comunes:

- `SessionNotFoundError`
- `SessionAlreadyExistsError`
- `SessionNotReadyError`
- `InvalidPhoneError`
- `AuthenticationError`
- `ConnectionError`
- `MediaSendError`
- `AdapterNotSupportedError`
- `AdapterMethodNotSupportedError`

```js
import { SessionNotReadyError } from 'whatsapp-connector';

try {
  await session.sendText('595981123456', 'Hola');
} catch (error) {
  if (error instanceof SessionNotReadyError) {
    console.log('La sesion todavia no esta lista.');
  }
}
```

## Desarrollo

Ejecutar tests:

```bash
npm test
```

Ejecutar tests en modo watch:

```bash
npm run test:watch
```

## Ejemplos

Ejecutar el ejemplo interactivo de consola:

```bash
node examples/console.js
```

Tambien podes indicar un `sessionId` personalizado:

```bash
node examples/console.js empresa-1
```

El ejemplo renderiza el QR directamente en consola, escucha cambios de estado y permite enviar texto, imagenes, PDFs y ubicaciones con comandos interactivos.

## Estructura

```text
examples/       Ejemplos ejecutables
src/
  adapters/      Adapters concretos, incluido wwebjs
  core/          Connector, sesiones, manager y base adapter
  errors/        Errores normalizados
  events/        EventBus global
  utils/         Normalizadores de mensajes, contactos, media y telefonos
types/           Definiciones TypeScript publicas
tests/           Tests y fixtures
```

## Licencia

ISC
