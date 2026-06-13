import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WhatsAppConnector } from '../../src/core/WhatsAppConnector.js';
import { FakeAdapterDefinition } from '../helpers/FakeAdapter.js';
import { SessionNotReadyError } from '../../src/errors/index.js';

describe('WhatsAppSession API and Events', () => {
  let connector;
  let session;

  beforeEach(async () => {
    connector = new WhatsAppConnector();
    connector.registerAdapter('fake', FakeAdapterDefinition);
    session = await connector.createSession('empresa-1', { adapter: 'fake' });
  });

  const waitForState = (targetState) => {
    return new Promise((resolve) => {
      if (session.getState() === targetState) {
        return resolve();
      }
      session.on('session.state.changed', (evt) => {
        if (evt.payload.current === targetState) {
          resolve();
        }
      });
    });
  };

  test('should not allow sending messages if session is not ready', async () => {
    await assert.rejects(
      async () => {
        await session.sendText('595981123456', 'hola');
      },
      SessionNotReadyError
    );
  });

  test('should transition through states and emit event details', async () => {
    const eventsEmitted = [];
    session.on('qr.received', (evt) => eventsEmitted.push({ name: 'qr.received', evt }));
    session.on('session.authenticated', (evt) => eventsEmitted.push({ name: 'session.authenticated', evt }));
    session.on('session.ready', (evt) => eventsEmitted.push({ name: 'session.ready', evt }));

    await waitForState('ready');

    assert.equal(session.getState(), 'ready');

    const qrEvent = eventsEmitted.find(e => e.name === 'qr.received');
    assert.ok(qrEvent);
    assert.equal(qrEvent.evt.sessionId, 'empresa-1');
    assert.equal(qrEvent.evt.adapter, 'fake');
    assert.equal(typeof qrEvent.evt.timestamp, 'number');
    assert.equal(qrEvent.evt.payload, 'fake-qr-code-data');

    const info = session.getInfo();
    assert.equal(info.phone, '595981123456');
    assert.equal(info.pushname, 'Empresa Demo');
    assert.equal(info.status, 'ready');

    assert.equal(session.generateQr, undefined);
  });

  test('should return standardized format on sendText', async () => {
    await waitForState('ready');
    const result = await session.sendText('595981123456', 'Hola mundo');
    assert.equal(result.messageId, 'fake-text-id');
    assert.equal(result.sessionId, 'empresa-1');
    assert.equal(result.adapter, 'fake');
    assert.ok(result.timestamp instanceof Date);
  });

  test('should return standardized format on media send methods', async () => {
    await waitForState('ready');
    
    const imageRes = await session.sendImage('595981123456', 'dGVzdA==', { mimetype: 'image/jpeg' });
    assert.equal(imageRes.messageId, 'fake-image-id');
    assert.ok(imageRes.timestamp instanceof Date);

    const pdfRes = await session.sendPdf('595981123456', 'dGVzdA==', { mimetype: 'application/pdf' });
    assert.equal(pdfRes.messageId, 'fake-pdf-id');

    const audioRes = await session.sendAudio('595981123456', 'dGVzdA==', { mimetype: 'audio/mp3' });
    assert.equal(audioRes.messageId, 'fake-audio-id');

    const docRes = await session.sendDocument('595981123456', 'dGVzdA==', { mimetype: 'application/octet-stream' });
    assert.equal(docRes.messageId, 'fake-doc-id');

    const mediaRes = await session.sendMedia('595981123456', 'dGVzdA==', { mimetype: 'image/png' });
    assert.equal(mediaRes.messageId, 'fake-media-id');
  });

  test('should return standardized format on sendLocation', async () => {
    await waitForState('ready');
    const result = await session.sendLocation('595981123456', {
      latitude: -25.30066,
      longitude: -57.63591,
      description: 'Oficina Central'
    });
    assert.equal(result.messageId, 'fake-location-id');
  });

  test('should react to a message', async () => {
    await waitForState('ready');
    await assert.doesNotReject(async () => {
      await session.reactToMessage('msg-123', '👍');
    });
  });

  test('should support restart and destroy lifecycle', async () => {
    await waitForState('ready');
    
    await session.restart();
    assert.equal(session.getState(), 'initializing');

    await session.destroy();
    assert.equal(session.getState(), 'destroyed');
  });
});
