import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCheckCircle, FaArrowRight, FaSpinner, FaNetworkWired, FaServer, FaCloud } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { getEnv } from '@/env';
import ipc from '@/ipc';
import { isElectron } from '@/utils/platform';

import type * as Types from '@/types';

import popupStyles from '@/styles/popup.module.css';
import ndStyles from '@/styles/networkDiagnosis.module.css';

interface NetworkDiagnosisPopupProps {
  id: string;
}

const NetworkDiagnosisPopup: React.FC<NetworkDiagnosisPopupProps> = React.memo(({ id }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);

  // States
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

  // Handlers
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
        const report = await ipc.network.runDiagnosis({ domains, duration });
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

    const env = getEnv();
    const getDomain = (url: string) => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    };

    const apiDomain = getDomain(env.API_URL);
    const wsDomain = getDomain(env.WS_URL);

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
      ipc.sfuDiagnosis.request();

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
          updateStage('sfu_info', 'failed');
          addLog(t('diagnosis-finished'));
          setIsTesting(false);
        }
      });
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

  // Effects
  useEffect(() => {
    if (scrollRef.current && activeTab === 'logs') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  useEffect(() => {
    return ipc.network.onProgress((progress: Types.ProgressData) => {
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
  }, []);

  const renderVisualProgress = () => (
    <div className={ndStyles['steps']}>
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className={`${ndStyles['step']} ${stage.status === 'active' ? ndStyles['step-active'] : ''} ${stage.status === 'completed' ? ndStyles['step-completed'] : ''}`}>
            <div className={ndStyles['step-icon-row']}>
              <div className={ndStyles['step-icon']}>{stage.status === 'active' ? <FaSpinner className={ndStyles['step-spinner']} /> : stage.icon}</div>
            </div>
            <div className={ndStyles['step-label']}>{stage.label}</div>
            {stage.status === 'active' && (stage.id === 'domain' || stage.id === 'sfu_test') && (
              <span className={ndStyles['step-progress-label']}>
                {progress.cycle}/{progress.totalCycles}
              </span>
            )}
          </div>
          {index < stages.length - 1 && (
            <div className={ndStyles['step-connector']}>
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
      <div key={idx} className={ndStyles['result-card']}>
        <div className={ndStyles['result-header']}>
          <span>Target: {res.domain}</span>
          {res.dns.resolved && <span className={ndStyles['result-header-dns']}>{res.dns.addresses[0]}</span>}
        </div>
        {res.mtr.executed ? (
          <table className={ndStyles['result-table']}>
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
                  <td className={ndStyles['host-cell']} title={hop.host || hop.ip}>
                    {hop.host || hop.ip}
                  </td>
                  <td className={hop.loss > 10 ? ndStyles['loss-bad'] : hop.loss > 0 ? ndStyles['loss-warn'] : ndStyles['loss-ok']}>{hop.loss}%</td>
                  <td>{hop.best}ms</td>
                  <td>{hop.worst}ms</td>
                  <td>{hop.avg}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={ndStyles['result-error']}>MTR Error: {res.mtr.error || 'Unknown error'}</div>
        )}
      </div>
    ));
  };

  if (!isElectron()) {
    return (
      <div className={popupStyles['popup-wrapper']}>
        <div
          className={popupStyles['popup-body']}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '1.2rem',
              color: '#555',
              fontWeight: 'bold',
            }}
          >
            {t('app-only-feature')}
          </div>
        </div>
        <div className={popupStyles['popup-footer']}>
          <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
            {t('close')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={ndStyles['content']}>
          <div className={ndStyles['header']}>
            <h2 className={ndStyles['title']}>{t('network-diagnosis')}</h2>
          </div>

          {renderVisualProgress()}

          <div className={ndStyles['tabs']}>
            <div className={`${ndStyles['tab']} ${activeTab === 'logs' ? ndStyles['tab-active'] : ''}`} onClick={handleTabLogsClick} role="tab" aria-selected={activeTab === 'logs'}>
              {t('diagnosis-logs')}
            </div>
            <div className={`${ndStyles['tab']} ${activeTab === 'reports' ? ndStyles['tab-active'] : ''}`} onClick={handleTabReportsClick} role="tab" aria-selected={activeTab === 'reports'}>
              {t('diagnosis-reports')}
              {(reports.domain || reports.sfu) && <span className={ndStyles['tab-badge']} aria-hidden />}
            </div>
          </div>

          <div className={ndStyles['panel']}>
            {activeTab === 'logs' ? (
              <div ref={scrollRef} className={ndStyles['logs-panel']} tabIndex={0}>
                {logs.length === 0 ? (
                  <div className={ndStyles['logs-placeholder']}>Click &quot;Start Test&quot; to begin...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={ndStyles['log-line']}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className={ndStyles['reports-panel']}>
                {!reports.domain && !reports.sfu && (
                  <div className={ndStyles['reports-empty']}>
                    <FaSpinner className={ndStyles['reports-empty-spinner']} style={{ fontSize: '1.5rem' }} />
                    <span>{t('Diagnosis in progress...')}</span>
                  </div>
                )}
                {reports.domain && (
                  <>
                    <div className={ndStyles['section-title']}>
                      <FaCloud /> API / WEBSOCKET SERVER
                    </div>
                    {renderDiagnosisResult(reports.domain)}
                  </>
                )}
                {reports.sfu && (
                  <>
                    <div className={`${ndStyles['section-title']} ${ndStyles['section-title-reports']}`}>
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

      <div className={popupStyles['popup-footer']}>
        <div
          className={popupStyles['button']}
          onClick={handleExportReportClick}
          style={{
            opacity: logs.length === 0 || isTesting ? 0.5 : 1,
            pointerEvents: logs.length === 0 || isTesting ? 'none' : 'auto',
            marginRight: 'auto',
          }}
        >
          {t('export-report')}
        </div>
        <div className={popupStyles['button']} onClick={handleStartTestClick} style={{ opacity: isTesting ? 0.5 : 1, pointerEvents: isTesting ? 'none' : 'auto' }}>
          {isTesting ? t('testing') : t('start-test')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

NetworkDiagnosisPopup.displayName = 'NetworkDiagnosisPopup';

export default NetworkDiagnosisPopup;
