import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WhatsAppConnector } from '../../src/core/WhatsAppConnector.js';
import { FakeAdapterDefinition } from '../helpers/FakeAdapter.js';
import { SessionAlreadyExistsError } from '../../src/errors/index.js';

describe('WhatsAppConnector Core API', () => {
  let connector;

  beforeEach(() => {
    connector = new WhatsAppConnector();
    connector.registerAdapter('fake', FakeAdapterDefinition);
  });

  test('should create a session successfully', async () => {
    const session = await connector.createSession('empresa-1', { adapter: 'fake' });
    assert.ok(session);
    assert.equal(session.sessionId, 'empresa-1');
    assert.equal(session.adapter, 'fake');
  });

  test('should not allow duplicate sessionIds', async () => {
    await connector.createSession('empresa-1', { adapter: 'fake' });
    await assert.rejects(
      async () => {
        await connector.createSession('empresa-1', { adapter: 'fake' });
      },
      SessionAlreadyExistsError
    );
  });

  test('should get an existing session by ID', async () => {
    await connector.createSession('empresa-1', { adapter: 'fake' });
    const session = connector.getSession('empresa-1');
    assert.ok(session);
    assert.equal(session.sessionId, 'empresa-1');
  });

  test('should list all active sessions', async () => {
    await connector.createSession('empresa-1', { adapter: 'fake' });
    await connector.createSession('empresa-2', { adapter: 'fake' });
    const list = connector.listSessions();
    assert.equal(list.length, 2);
    assert.ok(list.some(s => s.sessionId === 'empresa-1'));
    assert.ok(list.some(s => s.sessionId === 'empresa-2'));
  });

  test('should remove and destroy a session', async () => {
    const session = await connector.createSession('empresa-1', { adapter: 'fake' });
    await connector.removeSession('empresa-1');
    assert.equal(connector.getSession('empresa-1'), undefined);
    assert.equal(session.getState(), 'destroyed');
  });

  test('should destroy all sessions on clean up', async () => {
    const s1 = await connector.createSession('empresa-1', { adapter: 'fake' });
    const s2 = await connector.createSession('empresa-2', { adapter: 'fake' });
    await connector.destroy();
    assert.equal(connector.listSessions().length, 0);
    assert.equal(s1.getState(), 'destroyed');
    assert.equal(s2.getState(), 'destroyed');
  });
});
