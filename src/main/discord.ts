import DiscordRPC from 'discord-rpc';
import log from 'electron-log';

export const DISCORD_RPC_CLIENT_ID = '1242441392341516288';

let rpc: DiscordRPC.Client | null = null;

export async function configureDiscordRPC() {
  DiscordRPC.register(DISCORD_RPC_CLIENT_ID);
  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  rpc = await rpc.login({ clientId: DISCORD_RPC_CLIENT_ID }).catch((error) => {
    log.error(`Cannot login to discord rpc:`, error.message);
    return null;
  });
}

export function updateDiscordPresence(presence: Record<string, string>) {
  if (!rpc) return;
  rpc.setActivity(presence);
}

export function clearDiscordPresence() {
  if (!rpc) return;
  rpc.clearActivity();
}
