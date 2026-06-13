import { EventEmitter } from 'events';

export type WhatsAppSessionStatus =
  | 'initializing'
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'disconnected'
  | 'destroyed'
  | 'failed';

export interface WhatsAppLocation {
  latitude: number;
  longitude: number;
  description?: string;
}

export interface WhatsAppMedia {
  base64: string;
  mimetype: string;
  filename?: string;
}

export interface WhatsAppMessage {
  messageId: string;
  sessionId: string;
  adapter: string;
  from: string;
  to: string;
  fromMe: boolean;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction' | 'system' | 'unknown';
  hasMedia: boolean;
  author?: string;
  timestamp: number;
  ack?: number;
  reaction?: string;
  location?: WhatsAppLocation;
}

export interface WhatsAppContact {
  contactId: string;
  phone: string;
  pushname?: string;
  name?: string;
  shortName?: string;
  isBusiness: boolean;
  isEnterprise: boolean;
  isGroup: boolean;
  profilePicture?: string;
}

export interface WhatsAppSessionInfo {
  sessionId: string;
  adapter: string;
  adapterVersion: string;
  status: WhatsAppSessionStatus;
  qr: string | null;
  phone: string | null;
  pushname: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppEventPayload<T = any> {
  sessionId: string;
  adapter: string;
  timestamp: number;
  payload: T;
}

export interface SendMessageOptions {
  [key: string]: any;
}

export interface SendMediaOptions {
  caption?: string;
  filename?: string;
  mimetype?: string;
  [key: string]: any;
}

export interface WhatsAppConnectorOptions {
  defaultAdapter?: string;
  [key: string]: any;
}

export class WhatsAppConnector {
  constructor(options?: WhatsAppConnectorOptions);
  createSession(sessionId: string, options?: any): Promise<WhatsAppSession>;
  getSession(sessionId: string): WhatsAppSession | undefined;
  listSessions(): WhatsAppSession[];
  removeSession(sessionId: string): Promise<void>;
  destroy(): Promise<void>;
}

export class WhatsAppSession extends EventEmitter {
  sessionId: string;
  adapter: string;

  constructor(sessionId: string, adapterInstance: any);

  sendText(to: string, message: string, options?: SendMessageOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendMedia(to: string, media: string | Buffer | WhatsAppMedia, options?: SendMediaOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendPdf(to: string, file: string | Buffer | WhatsAppMedia, options?: SendMediaOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendImage(to: string, file: string | Buffer | WhatsAppMedia, options?: SendMediaOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendAudio(to: string, file: string | Buffer | WhatsAppMedia, options?: SendMediaOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendDocument(to: string, file: string | Buffer | WhatsAppMedia, options?: SendMediaOptions): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  sendLocation(to: string, location: WhatsAppLocation, options?: any): Promise<{ messageId: string; sessionId: string; adapter: string; timestamp: number }>;
  reactToMessage(messageId: string, reaction: string): Promise<void>;

  getInfo(): WhatsAppSessionInfo;
  getState(): WhatsAppSessionStatus;
  restart(): Promise<void>;
  destroy(): Promise<void>;

  // Optional methods (can throw AdapterMethodNotSupportedError)
  listMessages(options?: any): Promise<WhatsAppMessage[]>;
  getMessage(messageId: string): Promise<WhatsAppMessage>;
  getContact(phone: string): Promise<WhatsAppContact>;
  getContacts(options?: any): Promise<WhatsAppContact[]>;
  getProfilePicture(phone: string): Promise<string>;
}

// Errors
export class WhatsAppError extends Error {
  status: number;
  code: string;
  details: any;
  isOperational: boolean;
}

export class SessionNotFoundError extends WhatsAppError {}
export class SessionAlreadyExistsError extends WhatsAppError {}
export class SessionNotReadyError extends WhatsAppError {}
export class InvalidPhoneError extends WhatsAppError {}
export class AuthenticationError extends WhatsAppError {}
export class ConnectionError extends WhatsAppError {}
export class MediaSendError extends WhatsAppError {}
export class AdapterNotSupportedError extends WhatsAppError {}
export class AdapterMethodNotSupportedError extends WhatsAppError {}
