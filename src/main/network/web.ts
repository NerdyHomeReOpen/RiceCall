import Logger from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runNetworkDiagnosis(_params: { domains: string[]; duration?: number }): Promise<{ error: string }> {
  new Logger('NETWORK_DIAGNOSIS_TOOL').info(`Network diagnosis only available in desktop version`);
  return { error: 'Network diagnosis only available in desktop version' };
}

export function cancelNetworkDiagnosis(): void {
  new Logger('NETWORK_DIAGNOSIS_TOOL').info(`Network diagnosis only available in desktop version`);
}

export function requestSfuDiagnosis(): void {
  new Logger('NETWORK_DIAGNOSIS_TOOL').info(`Network diagnosis only available in desktop version`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sfuDiagnosisResponse(_info: unknown): void {
  new Logger('NETWORK_DIAGNOSIS_TOOL').info(`Network diagnosis only available in desktop version`);
}
