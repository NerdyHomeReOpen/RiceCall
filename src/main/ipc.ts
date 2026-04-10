import { accounts } from '@/main/accounts';
import { server, dontShowDisclaimerNextTime, checkForUpdates } from '@/main/app';
import { auth } from '@/main/auth';
import { data } from '@/main/data';
import { discord } from '@/main/discord';
import { env } from '@/main/env';
import { error } from '@/main/error';
import { language } from '@/main/language';
import { webrtc, deepLink, fontList, loopbackAudio, exit, initialData } from '@/main/misc';
import { networkDiagnosis, sfuDiagnosis } from '@/main/network';
import { popup } from '@/main/popup';
import { record } from '@/main/record';
import { socket } from '@/main/socket';
import { systemSettings } from '@/main/systemSettings';
import { customThemes } from '@/main/customThemes';
import { tray } from '@/main/tray';
import { window_ } from '@/main/window';

const ipc = {
  accounts,
  server,
  dontShowDisclaimerNextTime,
  checkForUpdates,
  auth,
  data,
  discord,
  env,
  error,
  language,
  webrtc,
  deepLink,
  fontList,
  loopbackAudio,
  exit,
  initialData,
  networkDiagnosis,
  sfuDiagnosis,
  popup,
  record,
  socket,
  systemSettings,
  customThemes,
  tray,
  window: window_,
};

export default ipc;
