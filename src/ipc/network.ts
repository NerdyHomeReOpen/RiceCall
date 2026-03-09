import * as Types from '@/types';
import { modules } from './modules';

export const network = {
  runDiagnosis: async (params: { domains: string[]; duration?: number }): Promise<Types.FullReport | { error: string }> => {
    return await modules.default.runNetworkDiagnosis(params);
  },

  cancelDiagnosis: (): void => {
    modules.default.cancelNetworkDiagnosis();
  },

  onProgress: (callback: (progress: Types.ProgressData) => void): (() => void) => {
    return modules.default.listen('network-diagnosis-progress', callback);
  },
};

export const sfuDiagnosis = {
  request: (): void => {
    modules.default.requestSfuDiagnosis();
  },

  onRequest: (callback: () => void): (() => void) => {
    return modules.default.listen('get-sfu-diagnosis', callback);
  },

  response: (info: Types.SFUDiagnosisInfo | null): void => {
    modules.default.sfuDiagnosisResponse(info);
  },

  onResponse: (callback: (info: Types.SFUDiagnosisInfo | null) => void): (() => void) => {
    return modules.default.listen('sfu-diagnosis-response', callback);
  },
};
