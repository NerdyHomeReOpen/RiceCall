// Database
import { database } from '@/index';

export const generateUniqueDisplayId = async (baseId = 20000000) => {
  const servers = (await database.get.all('servers')) || {};
  let displayId = baseId + Object.keys(servers).length;

  // Ensure displayId is unique
  while (
    Object.values(servers).some((server: any) => server.displayId === displayId)
  ) {
    displayId++;
  }

  return displayId;
};

export async function biDirectionalAsyncOperation(func: (arg0: any, arg1: any) => Promise<void>, args: any[]) {
  await func(args[0], args[1]);
  await func(args[1], args[0]);
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
