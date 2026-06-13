export const rawTextMessage = {
  id: { _serialized: 'msg-123' },
  from: '595981123456@c.us',
  to: '595981654321@c.us',
  fromMe: false,
  body: 'Hola mundo',
  type: 'chat',
  hasMedia: false,
  author: '595981123456@c.us',
  timestamp: 1620000000,
  ack: 1
};

export const rawLocationMessage = {
  id: { _serialized: 'msg-456' },
  from: '595981123456@c.us',
  to: '595981654321@c.us',
  fromMe: true,
  body: '',
  type: 'location',
  hasMedia: false,
  timestamp: 1620000100,
  location: {
    latitude: -25.30066,
    longitude: -57.63591,
    description: 'Oficina Central'
  }
};

export const rawMediaMessage = {
  id: { _serialized: 'msg-789' },
  from: '595981123456@c.us',
  to: '595981654321@c.us',
  fromMe: false,
  body: '',
  type: 'image',
  hasMedia: true,
  timestamp: 1620000200
};
