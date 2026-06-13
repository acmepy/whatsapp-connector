import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import qrcode from 'qrcode-terminal';
import { WhatsAppConnector } from '../src/index.js';

const DEFAULT_SESSION_ID = 'console-demo';

const rl = readline.createInterface({ input, output });

const connector = new WhatsAppConnector({
  dataPath: './sessions',
  puppeteer: {
    headless: true
  }
});

let session;

function printHelp() {
  console.log(`
Comandos disponibles:
  help                         Muestra esta ayuda
  status                       Muestra el estado de la sesion
  info                         Muestra informacion de la sesion
  send <telefono> <mensaje>    Envia un mensaje de texto
  image <telefono> <ruta>      Envia una imagen
  pdf <telefono> <ruta>        Envia un PDF
  location <telefono> <lat> <lng> [descripcion]
  restart                      Reinicia la sesion
  exit                         Cierra la sesion y termina el proceso
`);
}

function printPrompt() {
  console.log('Escribi "help" para ver los comandos disponibles.');
}

async function waitForReady(currentSession) {
  if (currentSession.getState() === 'ready') {
    return;
  }

  await new Promise((resolve, reject) => {
    currentSession.once('session.ready', resolve);
    currentSession.once('session.failed', (event) => {
      reject(new Error(event.payload?.error || 'La sesion fallo al iniciar.'));
    });
  });
}

async function handleCommand(line) {
  const [command, ...args] = line.trim().split(' ');

  if (!command) {
    return;
  }

  switch (command.toLowerCase()) {
    case 'help':
      printHelp();
      break;

    case 'status':
      console.log(`Estado: ${session.getState()}`);
      break;

    case 'info':
      console.log(session.getInfo());
      break;

    case 'send': {
      const [phone, ...messageParts] = args;
      const message = messageParts.join(' ');

      if (!phone || !message) {
        console.log('Uso: send <telefono> <mensaje>');
        break;
      }

      await waitForReady(session);
      const result = await session.sendText(phone, message);
      console.log('Mensaje enviado:', result);
      break;
    }

    case 'image': {
      const [phone, filePath] = args;

      if (!phone || !filePath) {
        console.log('Uso: image <telefono> <ruta>');
        break;
      }

      await waitForReady(session);
      const result = await session.sendImage(phone, filePath);
      console.log('Imagen enviada:', result);
      break;
    }

    case 'pdf': {
      const [phone, filePath] = args;

      if (!phone || !filePath) {
        console.log('Uso: pdf <telefono> <ruta>');
        break;
      }

      await waitForReady(session);
      const result = await session.sendPdf(phone, filePath);
      console.log('PDF enviado:', result);
      break;
    }

    case 'location': {
      const [phone, latitude, longitude, ...descriptionParts] = args;

      if (!phone || !latitude || !longitude) {
        console.log('Uso: location <telefono> <lat> <lng> [descripcion]');
        break;
      }

      await waitForReady(session);
      const result = await session.sendLocation(phone, {
        latitude: Number(latitude),
        longitude: Number(longitude),
        description: descriptionParts.join(' ') || undefined
      });
      console.log('Ubicacion enviada:', result);
      break;
    }

    case 'restart':
      await session.restart();
      console.log('Sesion reiniciada. Esperando nuevo estado...');
      break;

    case 'exit':
      await connector.destroy();
      rl.close();
      return false;

    default:
      console.log(`Comando desconocido: ${command}`);
      printPrompt();
  }

  return true;
}

async function main() {
  const sessionId = process.argv[2] || DEFAULT_SESSION_ID;

  console.log(`Iniciando sesion "${sessionId}"...`);
  session = await connector.createSession(sessionId);

  session.on('qr.received', (event) => {
    console.log('\nQR recibido. Escanealo con WhatsApp:');
    qrcode.generate(event.payload, { small: true });
    console.log('');
  });

  session.on('session.state.changed', (event) => {
    console.log(`Estado: ${event.payload.previous} -> ${event.payload.current}`);
  });

  session.on('session.ready', () => {
    console.log('Sesion lista para enviar mensajes.');
  });

  session.on('message.received', (event) => {
    const message = event.payload;
    console.log(`Mensaje recibido de ${message.from}: ${message.body}`);
  });

  session.on('session.failed', (event) => {
    console.error('La sesion fallo:', event.payload?.error || event.payload);
  });

  printPrompt();

  while (true) {
    const line = await rl.question('whatsapp> ');
    const shouldContinue = await handleCommand(line);

    if (shouldContinue === false) {
      break;
    }
  }
}

main().catch(async (error) => {
  console.error(error);
  await connector.destroy().catch(() => {});
  rl.close();
  process.exitCode = 1;
});
