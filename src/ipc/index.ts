import { auth } from './auth';
import { socket } from './socket';
import { data } from './data';
import { initialData, popup } from './popup';
import { window_ } from './window';
import { accounts } from './accounts';
import { language } from './language';
import { customThemes } from './themes';
import { systemSettings } from './systemSettings';
import { network, sfuDiagnosis } from './network';
import { error, webrtc, deepLink, discord, fontList, record, tray, loopbackAudio, env, server, dontShowDisclaimerNextTime, checkForUpdates, exit } from './misc';

const ipc = {
  error,
  webrtc,
  exit,
  socket,
  auth,
  data,
  deepLink,
  window: window_,
  initialData,
  popup,
  accounts,
  language,
  customThemes,
  discord,
  fontList,
  record,
  tray,
  loopbackAudio,
  dontShowDisclaimerNextTime,
  checkForUpdates,
  env,
  server,
  systemSettings,
  network,
  sfuDiagnosis,
};

export default ipc;
