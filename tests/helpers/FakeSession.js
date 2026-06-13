import { EventEmitter } from 'events';

export class FakeSession extends EventEmitter {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.adapter = 'fake';
    this.status = 'ready';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async sendText(to, message, options) {
    return {
      messageId: 'fake-text-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendPdf(to, file, options) {
    return {
      messageId: 'fake-pdf-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendImage(to, file, options) {
    return {
      messageId: 'fake-image-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendAudio(to, file, options) {
    return {
      messageId: 'fake-audio-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendDocument(to, file, options) {
    return {
      messageId: 'fake-doc-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendLocation(to, location, options) {
    return {
      messageId: 'fake-location-id',
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async reactToMessage(messageId, reaction) {
    return {
      messageId,
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  getInfo() {
    return {
      sessionId: this.sessionId,
      adapter: this.adapter,
      adapterVersion: '1.0.0',
      status: this.status,
      qr: null,
      phone: '595981123456',
      pushname: 'Fake User',
      reason: null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  getState() {
    return this.status;
  }

  async restart() {
    this.updatedAt = new Date();
  }

  async destroy() {
    this.status = 'destroyed';
    this.emit('session.destroyed', {
      sessionId: this.sessionId,
      adapter: this.adapter,
      timestamp: Date.now(),
      payload: null
    });
  }
}

export default FakeSession;
