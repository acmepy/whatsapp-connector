import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../../src/core/SessionManager.js';
import { FakeSession } from '../helpers/FakeSession.js';
import { SessionAlreadyExistsError, SessionNotFoundError } from '../../src/errors/index.js';

describe('SessionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  test('should add a session and retrieve it', () => {
    const session = new FakeSession('session-1');
    manager.addSession('session-1', session);

    assert.equal(manager.getSession('session-1'), session);
    assert.ok(manager.listSessions().includes(session));
  });

  test('should not allow duplicate sessions', () => {
    const session1 = new FakeSession('session-1');
    const session2 = new FakeSession('session-1');

    manager.addSession('session-1', session1);
    assert.throws(() => manager.addSession('session-1', session2), SessionAlreadyExistsError);
  });

  test('should return undefined if session does not exist', () => {
    assert.equal(manager.getSession('non-existent'), undefined);
  });

  test('should remove a session and call its destroy method', async () => {
    const session = new FakeSession('session-1');
    let destroyed = false;
    session.destroy = async () => {
      destroyed = true;
    };

    manager.addSession('session-1', session);
    await manager.removeSession('session-1');

    assert.equal(manager.getSession('session-1'), undefined);
    assert.equal(destroyed, true);
  });

  test('should throw SessionNotFoundError when removing non-existent session', async () => {
    await assert.rejects(async () => {
      await manager.removeSession('non-existent');
    }, SessionNotFoundError);
  });

  test('should destroy all sessions', async () => {
    const session1 = new FakeSession('session-1');
    const session2 = new FakeSession('session-2');
    
    let destructions = 0;
    session1.destroy = async () => { destructions++; };
    session2.destroy = async () => { destructions++; };

    manager.addSession('session-1', session1);
    manager.addSession('session-2', session2);

    await manager.destroy();

    assert.equal(manager.listSessions().length, 0);
    assert.equal(destructions, 2);
  });
});
