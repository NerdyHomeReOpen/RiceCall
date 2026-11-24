import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCheckCircle, FaArrowRight, FaSpinner, FaNetworkWired, FaServer, FaCloud } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import Env from '@/utils/env';
import { isElectron } from '@/utils/platform';

type NetworkDiagnosisPopupProps = Types.PopupProps<'networkDiagnosis'>;

function getLossClassName(loss: number): string {
  if (loss > 10) return 'text-text-warning';
  if (loss > 0) return 'text-[#f0a020]';
  return 'text-[#0fb11f]';
}

const NetworkDiagnosisPopup: React.FC<NetworkDiagnosisPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, cycle: 0, totalCycles: 0 });
  const [activeTab, setActiveTab] = useState<'logs' | 'reports'>('logs');
  const [reports, setReports] = useState<{ domain?: Types.DiagnosisResult[]; sfu?: Types.DiagnosisResult[] }>({});

  const [stages, setStages] = useState<Types.Stage[]>([
    { id: 'init', label: t('diagnosis-initialize'), icon: <FaNetworkWired />, status: 'pending' },
    { id: 'domain', label: t('diagnosis-api-ws-test'), icon: <FaCloud />, status: 'pending' },
    { id: 'sfu_info', label: t('diagnosis-sfu-check'), icon: <FaServer />, status: 'pending' },
    { id: 'sfu_test', label: t('diagnosis-sfu-test'), icon: <FaCheckCircle />, status: 'pending' },
  ]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const updateStage = useCallback((id: string, status: Types.StepStatus) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  const runDiagnosis = useCallback(
    async (domains: string[], duration: number = 3): Promise<Types.FullReport | null> => {
      addLog(`Starting diagnosis for: ${domains.join(', ')}`);
      setProgress({ current: 0, cycle: 0, totalCycles: duration });

      try {
        const report = await ipc.networkDiagnosis.run({ domains, duration });

        if (report && 'error' in report && (report as Types.ReportError).error) {
          addLog(`Diagnosis error: ${(report as Types.ReportError).error}`);
          return null;
        }

        return report as Types.FullReport;
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        addLog(`IPC Error: ${error.message}`);
        return null;
      }
    },
    [addLog],
  );

  const handleStartTestClick = useCallback(async () => {
    if (isTesting) return;
    setIsTesting(true);
    setLogs([]);
    setReports({});
    setProgress({ current: 0, cycle: 0, totalCycles: 0 });
    setActiveTab('logs');
    setStages((prev) => prev.map((s) => ({ ...s, status: 'pending' })));
    addLog('Starting Network Diagnosis');
    updateStage('init', 'active');
    const env = Env.get();

    const getDomain = (url: string) => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    };

    const apiDomain = getDomain(env.MAIN_SERVICE_URL);
    const wsDomain = getDomain(env.MAIN_SERVICE_WS_URL);
    updateStage('init', 'completed');
    updateStage('domain', 'active');
    const domains = Array.from(new Set([apiDomain, wsDomain])).filter(Boolean);

    setReports((prev) => ({
      ...prev,
      domain: domains.map((d) => ({
        domain: d,
        dns: { resolved: false, addresses: [], error: null },
        mtr: { executed: false, hops: [], error: null },
      })),
    }));

    const report1 = await runDiagnosis(domains, 3);

    if (report1) {
      setReports((prev) => ({ ...prev, domain: report1.diagnosis }));
      addLog('--- Domain Diagnosis Completed ---');
      updateStage('domain', 'completed');
    } else {
      updateStage('domain', 'failed');
    }

    addLog('Checking SFU Connection...');
    updateStage('sfu_info', 'active');

    try {
      const unsubscribe = ipc.sfuDiagnosis.onResponse((info: { ip?: string; port?: number } | null) => {
        unsubscribe();

        if (info?.ip) {
          const sfuIp = info.ip;
          addLog(`SFU Connected: ${sfuIp}:${info.port ?? ''}`);
          updateStage('sfu_info', 'completed');
          updateStage('sfu_test', 'active');
          addLog(`Starting diagnosis for SFU: ${sfuIp}`);

          setReports((prev) => ({
            ...prev,
            sfu: [
              {
                domain: sfuIp,
                dns: { resolved: true, addresses: [sfuIp], error: null },
                mtr: { executed: false, hops: [], error: null },
              },
            ],
          }));

          runDiagnosis([sfuIp], 5).then((report2) => {
            if (report2) {
              setReports((prev) => ({ ...prev, sfu: report2.diagnosis }));
              updateStage('sfu_test', 'completed');
              setActiveTab('reports');
            } else {
              updateStage('sfu_test', 'failed');
            }

            addLog(t('diagnosis-finished'));
            setIsTesting(false);
          });
        } else {
          addLog('No active SFU connection found.');
          updateStage('sfu_info', 'completed');
          updateStage('sfu_test', 'active');
          addLog('Skipping SFU test (no active connection).');
          updateStage('sfu_test', 'completed');
          setActiveTab('reports');
          addLog(t('diagnosis-finished'));
          setIsTesting(false);
        }
      });

      ipc.sfuDiagnosis.request();
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      addLog(`Error requesting SFU info: ${error.message}`);
      updateStage('sfu_info', 'failed');
      setIsTesting(false);
    }
  }, [isTesting, addLog, t, updateStage, runDiagnosis]);

  const handleExportReportClick = useCallback(() => {
    if (logs.length === 0) return;
    const timestamp = new Date().toLocaleString();
    let content = `RiceCall Network Diagnosis Report\n`;
    content += `Generated: ${timestamp}\n`;
    content += `==========================================\n\n`;
    content += `--- DIAGNOSIS LOGS ---\n`;
    content += logs.join('\n');
    content += `\n\n`;

    if (reports.domain) {
      content += `--- API / WEBSOCKET SERVER REPORT ---\n`;

      reports.domain.forEach((res) => {
        content += `Target: ${res.domain} (${res.dns.addresses.join(', ') || 'DNS Failed'})\n`;

        if (res.mtr.executed) {
          content += `Hop | Host                 | Loss% | Min   | Max   | Avg\n`;

          res.mtr.hops.forEach((h, hIdx) => {
            content += `${String(h.hop || hIdx + 1).padEnd(3)} | ${String(h.host || h.ip).padEnd(20)} | ${String(h.loss + '%').padEnd(5)} | ${String(h.best + 'ms').padEnd(5)} | ${String(h.worst + 'ms').padEnd(5)} | ${h.avg}ms\n`;
          });
        } else {
          content += `MTR Error: ${res.mtr.error}\n`;
        }

        content += `\n`;
      });
    }

    if (reports.sfu) {
      content += `--- SFU (VOICE/VIDEO) SERVER REPORT ---\n`;

      reports.sfu.forEach((res) => {
        content += `Target: ${res.domain}\n`;

        if (res.mtr.executed) {
          content += `Hop | Host                 | Loss% | Min   | Max   | Avg\n`;

          res.mtr.hops.forEach((h, hIdx) => {
            content += `${String(h.hop || hIdx + 1).padEnd(3)} | ${String(h.host || h.ip).padEnd(20)} | ${String(h.loss + '%').padEnd(5)} | ${String(h.best + 'ms').padEnd(5)} | ${String(h.worst + 'ms').padEnd(5)} | ${h.avg}ms\n`;
          });
        } else {
          content += `MTR Error: ${res.mtr.error}\n`;
        }

        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RiceCall_Diagnosis_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs, reports]);

  const handleCloseBtnClick = useCallback(() => {
    ipc.popup.close(id);
  }, [id]);

  const handleTabLogsClick = useCallback(() => setActiveTab('logs'), []);
  const handleTabReportsClick = useCallback(() => setActiveTab('reports'), []);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'logs') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  useEffect(() => {
    const unsub = ipc.networkDiagnosis.onProgress((progress: Types.ProgressData) => {
      const { step, cycle, totalCycles, hops, domain } = progress;

      if (step === 'mtr_ping_progress' && cycle !== undefined && totalCycles !== undefined) {
        const percentage = Math.round((cycle / totalCycles) * 100);
        setProgress({ current: percentage, cycle, totalCycles });

        if (hops && domain) {
          setReports((prev) => {
            const isSfu = prev.sfu?.some((r) => r.domain === domain);
            const updateTarget = (list?: Types.DiagnosisResult[]) => list?.map((r) => (r.domain === domain ? { ...r, mtr: { ...r.mtr, executed: true, hops } } : r));
            if (isSfu) return { ...prev, sfu: updateTarget(prev.sfu) };
            return { ...prev, domain: updateTarget(prev.domain) };
          });
        }
      }
    });

    return () => unsub();
  }, []);

  const renderVisualProgress = () => (
    <div className="flex gap-[4px] items-stretch justify-between py-[12px] px-[14px] mb-[4px] bg-popup-background border border-border rounded-[8px]">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div
            className={`relative flex flex-1 flex-col gap-[6px] items-center min-w-0 transition-[opacity] duration-200 ease-[ease] ${stage.status === 'active' || stage.status === 'completed' ? 'opacity-100' : 'opacity-50'}`}
          >
            <div className="flex flex-row gap-[8px] items-center justify-center w-full min-h-[40px]">
              <div
                className={`flex shrink-0 items-center justify-center w-[40px] h-[40px] text-[1.5rem] transition-[color] duration-200 ease-[ease] ${stage.status === 'active' ? 'text-text-link' : stage.status === 'completed' ? 'text-[#0fb11f]' : 'text-text-color-quaternary'}`}
              >
                {stage.status === 'active' ? <FaSpinner className="animate-spin" /> : stage.icon}
              </div>
            </div>
            <div
              className={`max-w-full overflow-hidden text-ellipsis text-[0.7rem] font-semibold text-center whitespace-nowrap ${stage.status === 'active' || stage.status === 'completed' ? 'text-text-color-secondary' : 'text-text-color-quaternary'}`}
            >
              {stage.label}
            </div>
            {stage.status === 'active' && (stage.id === 'domain' || stage.id === 'sfu_test') && (
              <span className="absolute bottom-[1rem] shrink-0 text-[0.65rem] text-text-link whitespace-nowrap">
                {progress.cycle}/{progress.totalCycles}
              </span>
            )}
          </div>
          {index < stages.length - 1 && (
            <div
              className={`flex flex-[0_0_24px] items-center justify-center text-[0.85rem] transition-[color] duration-200 ease-[ease] ${stage.status === 'completed' ? 'text-[#0fb11f]' : 'text-border'}`}
            >
              <FaArrowRight />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderDiagnosisResult = (results?: Types.DiagnosisResult[]) => {
    if (!results) return null;

    return results.map((res, idx) => (
      <div key={idx} className="p-[12px] mb-[14px] overflow-x-scroll bg-popup-background border border-border rounded-[8px]">
        <div className="sticky top-0 left-0 flex items-center justify-between pb-[6px] mb-[8px] text-[0.9rem] font-semibold text-text-link border-b border-border">
          <span>Target: {res.domain}</span>
          {res.dns.resolved && <span className="text-[0.75rem] font-normal text-text-color-quaternary">{res.dns.addresses[0]}</span>}
        </div>
        {res.mtr.executed ? (
          <table className="w-full text-[0.8rem] text-text-color-secondary border-collapse [&_th]:py-[6px] [&_th]:px-[8px] [&_th]:font-medium [&_th]:text-text-color [&_th]:text-left [&_th]:border-b [&_th]:border-border [&_td]:py-[6px] [&_td]:px-[8px] [&_td]:border-b [&_td]:border-border [&_tr:last-child_td]:[border-bottom:none]">
            <thead>
              <tr>
                <th>Hop</th>
                <th>Host</th>
                <th>Loss%</th>
                <th>Min</th>
                <th>Max</th>
                <th>Avg</th>
              </tr>
            </thead>
            <tbody>
              {res.mtr.hops.map((hop, hIdx) => (
                <tr key={hIdx}>
                  <td>{hop.hop || hIdx + 1}</td>
                  <td className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" title={hop.host || hop.ip}>
                    {hop.host || hop.ip}
                  </td>
                  <td className={getLossClassName(hop.loss)}>{hop.loss}%</td>
                  <td>{hop.best}ms</td>
                  <td>{hop.worst}ms</td>
                  <td>{hop.avg}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-[10px] text-[0.8rem] text-text-warning">MTR Error: {res.mtr.error || 'Unknown error'}</div>
        )}
      </div>
    ));
  };

  if (!isElectron()) {
    return (
      <div className="popup-wrapper">
        <div className="popup-body flex flex-col gap-[20px] items-center justify-center h-full">
          <div className="text-[1.2rem] font-bold text-[#555]">{t('app-only-feature')}</div>
        </div>
        <div className="popup-footer">
          <div className="button" onClick={handleCloseBtnClick}>
            {t('close')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="flex flex-col gap-[14px] w-full h-full min-h-0 py-[16px] px-[20px] overflow-hidden">
          <div className="flex items-center justify-between mb-[2px]">
            <h2 className="text-[1.1rem] font-semibold text-text-color">{t('network-diagnosis')}</h2>
          </div>
          {renderVisualProgress()}
          <div className="flex gap-0 mb-[10px] border-b border-border">
            <div
              className={`flex gap-[6px] items-center py-[8px] px-[18px] -mb-px text-[0.85rem] cursor-pointer border-b-2 transition-[color,border-color] duration-200 ease-[ease] hover:text-text-color-secondary ${activeTab === 'logs' ? 'font-semibold text-text-link border-b-text-link' : 'text-text-color-quaternary border-b-transparent'}`}
              onClick={handleTabLogsClick}
              role="tab"
              aria-selected={activeTab === 'logs'}
            >
              {t('diagnosis-logs')}
            </div>
            <div
              className={`flex gap-[6px] items-center py-[8px] px-[18px] -mb-px text-[0.85rem] cursor-pointer border-b-2 transition-[color,border-color] duration-200 ease-[ease] hover:text-text-color-secondary ${activeTab === 'reports' ? 'font-semibold text-text-link border-b-text-link' : 'text-text-color-quaternary border-b-transparent'}`}
              onClick={handleTabReportsClick}
              role="tab"
              aria-selected={activeTab === 'reports'}
            >
              {t('diagnosis-reports')}
              {(reports.domain || reports.sfu) && <span className="shrink-0 w-[6px] h-[6px] bg-[#0fb11f] rounded-[50%]" aria-hidden />}
            </div>
          </div>
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
            {activeTab === 'logs' ? (
              <div
                ref={scrollRef}
                className="flex-1 p-[12px] overflow-y-auto [font-family:ui-monospace,monospace] text-[0.8rem] text-text-color-secondary whitespace-pre-wrap select-text bg-popup-background border border-border rounded-[6px] focus:outline-none"
                tabIndex={0}
              >
                {logs.length === 0 ? (
                  <div className="text-text-color-quaternary">Click &quot;Start Test&quot; to begin...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="pb-[4px] mb-[4px] text-text-color-secondary border-b border-border">
                      {log}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto select-text rounded-[6px]">
                {!reports.domain && !reports.sfu && (
                  <div className="flex flex-col gap-[10px] items-center justify-center h-full min-h-[120px] text-text-color-quaternary">
                    <FaSpinner className="text-[1.5rem] animate-spin" />
                    <span>{t('Diagnosis in progress...')}</span>
                  </div>
                )}
                {reports.domain && (
                  <>
                    <div className="flex gap-[8px] items-center mb-[10px] text-[0.8rem] font-semibold text-text-color-tertiary">
                      <FaCloud /> API / WEBSOCKET SERVER
                    </div>
                    {renderDiagnosisResult(reports.domain)}
                  </>
                )}
                {reports.sfu && (
                  <>
                    <div className="flex gap-[8px] items-center mt-[18px] mb-[10px] text-[0.8rem] font-semibold text-text-color-tertiary first:mt-0">
                      <FaServer /> SFU (VOICE/VIDEO) SERVER
                    </div>
                    {renderDiagnosisResult(reports.sfu)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button mr-auto ${logs.length === 0 || isTesting ? 'pointer-events-none opacity-50' : ''}`} onClick={handleExportReportClick}>
          {t('export-report')}
        </div>
        <div className={`button ${isTesting ? 'pointer-events-none opacity-50' : ''}`} onClick={handleStartTestClick}>
          {isTesting ? t('testing') : t('start-test')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

NetworkDiagnosisPopup.displayName = 'NetworkDiagnosisPopup';

export default NetworkDiagnosisPopup;
