import { WhatsAppConnector } from './core/WhatsAppConnector.js';
import { WhatsAppSession } from './core/WhatsAppSession.js';
import { EventBus } from './events/EventBus.js';
import * as Errors from './errors/index.js';

export {
  WhatsAppConnector,
  WhatsAppSession,
  EventBus,
  Errors
};

// Export individual errors as well for direct destructured imports
export {
  WhatsAppError,
  SessionNotFoundError,
  SessionAlreadyExistsError,
  SessionNotReadyError,
  InvalidPhoneError,
  AuthenticationError,
  ConnectionError,
  MediaSendError,
  AdapterNotSupportedError,
  AdapterMethodNotSupportedError
} from './errors/index.js';
