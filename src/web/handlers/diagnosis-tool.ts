import Logger from '@/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runNetworkDiagnosis(_params: { domains: string[]; duration?: number }): Promise<{ error: string }> {
  new Logger('NetworkDiagnosisTool').info(`Network diagnosis only available in desktop version`);
  return { error: 'Network diagnosis only available in desktop version' };
}

export function cancelNetworkDiagnosis() {
  new Logger('NetworkDiagnosisTool').info(`Network diagnosis only available in desktop version`);
}

export function requestSfuDiagnosis() {
  new Logger('NetworkDiagnosisTool').info(`Network diagnosis only available in desktop version`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sfuDiagnosisResponse(_data: { targetSenderId: number; info: unknown } | null) {
  new Logger('NetworkDiagnosisTool').info(`Network diagnosis only available in desktop version`);
}
