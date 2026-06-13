import { EventEmitter } from 'events';

/**
 * Global Event Bus to aggregate events from all active sessions.
 */
class GlobalEventBus extends EventEmitter {
  /**
   * Publishes an event to the global event bus.
   * @param {string} eventName 
   * @param {object} eventObj 
   */
  publish(eventName, eventObj) {
    this.emit(eventName, eventObj);
  }
}

export const EventBus = new GlobalEventBus();
export default EventBus;
