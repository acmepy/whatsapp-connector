import { BaseAdapter } from '../../src/core/BaseAdapter.js';

export class FakeAdapter extends BaseAdapter {
  constructor(sessionId, options = {}) {
    super(sessionId, options, 'fake');
    this.status = 'disconnected';
    this.qrCode = 'fake-qr-code-data';
    this.phone = '595981123456';
    this.pushname = 'Empresa Demo';
    this.reason = null;
  }

  async initialize() {
    this.status = 'initializing';
    
    // Simulate adapter background initialization
    process.nextTick(() => {
      this.status = 'qr';
      this.emit('qr', this.qrCode);

      process.nextTick(() => {
        this.status = 'authenticated';
        this.emit('authenticated');

        process.nextTick(() => {
          this.status = 'ready';
          this.emit('ready');
        });
      });
    });
  }

  async destroy() {
    this.status = 'destroyed';
  }

  async restart() {
    await this.destroy();
    await this.initialize();
  }

  _makeResult(messageId) {
    return {
      messageId,
      sessionId: this.sessionId,
      adapter: 'fake',
      timestamp: new Date()
    };
  }

  async sendText(to, message, options) {
    return this._makeResult('fake-text-id');
  }

  async sendMedia(to, media, options) {
    return this._makeResult('fake-media-id');
  }

  async sendPdf(to, file, options) {
    return this._makeResult('fake-pdf-id');
  }

  async sendImage(to, file, options) {
    return this._makeResult('fake-image-id');
  }

  async sendAudio(to, file, options) {
    return this._makeResult('fake-audio-id');
  }

  async sendDocument(to, file, options) {
    return this._makeResult('fake-doc-id');
  }

  async sendLocation(to, location, options) {
    return this._makeResult('fake-location-id');
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
      adapterVersion: '1.0.0',
      qr: this.status === 'qr' ? this.qrCode : null,
      phone: this.phone,
      pushname: this.pushname,
      reason: this.reason
    };
  }

  getState() {
    return this.status;
  }

  // Implementation of optional methods
  async listMessages(options) {
    return [];
  }

  async getMessage(messageId) {
    return {
      messageId,
      sessionId: this.sessionId,
      adapter: 'fake',
      from: '595981123456@c.us',
      to: '595981654321@c.us',
      fromMe: false,
      body: 'mock body',
      type: 'text',
      hasMedia: false,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  async getContact(phone) {
    return {
      contactId: `${phone}@c.us`,
      phone,
      pushname: 'Fake Contact',
      name: 'Fake Contact',
      shortName: 'Fake',
      isBusiness: false,
      isEnterprise: false,
      isGroup: false,
      profilePicture: null
    };
  }

  async getContacts(options) {
    return [];
  }

  async getProfilePicture(phone) {
    return 'https://fake-pfp';
  }
}

export const FakeAdapterDefinition = {
  name: 'fake',
  createSession(sessionId, options) {
    return new FakeAdapter(sessionId, options);
  }
};

export default FakeAdapterDefinition;
