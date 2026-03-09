import * as Types from '@/types';
import { modules } from './modules';

export const socket = {
  send: <T extends keyof Types.ClientToServerEvents>(event: T, ...args: Parameters<Types.ClientToServerEvents[T]>): void => {
    modules.default.socketSend(event, ...args);
  },

  on: <T extends keyof Types.ServerToClientEvents>(event: T, callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>): (() => void) => {
    return modules.default.listen(event, callback);
  },

  emit: async <T extends keyof Types.ClientToServerEventsWithAck>(
    event: T,
    payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0],
  ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> => {
    const ack = await modules.default.socketEmit(event, payload);
    if (ack?.ok) return ack.data;
    throw new Error(ack?.error || 'Unknown error');
  },
};
