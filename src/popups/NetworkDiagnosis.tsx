import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaArrowRight, FaSpinner, FaNetworkWired, FaServer, FaCloud, FaWindowMaximize, FaTimes } from 'react-icons/fa';
import ipc from '@/ipc';
import { isElectron } from '@/platform/ipc';

import styles from '@/styles/popup.module.css';

interface MtrHop {
  hop: number;
  host: string;
  ip: string;
  loss: number;
  avg: number;
  best: number;
  worst: number;
  stdev: number;
}

interface DiagnosisResult {
  domain: string;
  dns: { resolved: boolean; addresses: string[]; error: string | null };
  mtr: { executed: boolean; hops: MtrHop[]; error: string | null };
}

interface FullReport {
  timestamp: string;
  localNetwork: any;
  diagnosis: DiagnosisResult[];
}

type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

interface Stage {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: StepStatus;
}

const NetworkDiagnosis: React.FC = React.memo(() => {
  const { t } = useTranslation();

  if (!isElectron()) {
    return (
      <div className={styles['popup-wrapper']}>
        <div className={styles['popup-body']} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          gap: '20px' 
        }}>
           <div style={{ 
             fontSize: '1.2rem', 
             color: '#555', 
             fontWeight: 'bold' 
           }}>
             {t('app-only-feature')}
           </div>
        </div>
        <div className={styles['popup-footer']}>
          <div className={styles['button']} onClick={() => ipc.window.close()}>
            {t('close')}
          </div>
        </div>
      </div>
    );
  }

  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, cycle: 0, totalCycles: 0 });
  const [activeTab, setActiveTab] = useState<'logs' | 'reports'>('logs');
  const [reports, setReports] = useState<{ domain?: DiagnosisResult[]; sfu?: DiagnosisResult[] }>({});
  const [stages, setStages] = useState<Stage[]>([
    { id: 'init', label: t('diagnosis-initialize'), icon: <FaNetworkWired />, status: 'pending' },
    { id: 'domain', label: t('diagnosis-api-ws-test'), icon: <FaCloud />, status: 'pending' },
    { id: 'sfu_info', label: t('diagnosis-sfu-check'), icon: <FaServer />, status: 'pending' },
    { id: 'sfu_test', label: t('diagnosis-sfu-test'), icon: <FaCheckCircle />, status: 'pending' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const updateStage = useCallback((id: string, status: StepStatus) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }, []);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'logs') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // Listen for progress from main process
  useEffect(() => {
    return ipc.network.onProgress((progressData: any) => {
        const { step, cycle, totalCycles, hops, domain } = progressData;
        
        // Handle MTR ping progress specifically
        if (step === 'mtr_ping_progress' && cycle !== undefined && totalCycles !== undefined) {
            const percentage = Math.round((cycle / totalCycles) * 100);
            setProgress({
                current: percentage,
                cycle,
                totalCycles
            });

            // LIVE UPDATE: Update the report view while testing
            if (hops && domain) {
                setReports(prev => {
                    const isSfu = prev.sfu?.some(r => r.domain === domain);
                    const updateTarget = (list?: DiagnosisResult[]) => 
                        list?.map(r => r.domain === domain ? { ...r, mtr: { ...r.mtr, executed: true, hops } } : r);
                    
                    if (isSfu) return { ...prev, sfu: updateTarget(prev.sfu) };
                    return { ...prev, domain: updateTarget(prev.domain) };
                });
            }
        }
    });
  }, []);

  const renderVisualProgress = () => {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '12px 15px', 
            borderRadius: '10px',
            marginBottom: '10px'
        }}>
            {stages.map((stage, index) => (
                <React.Fragment key={stage.id}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '5px',
                        flex: 1,
                        position: 'relative',
                        opacity: stage.status === 'pending' ? 0.3 : 1
                    }}>
                        <div style={{ 
                            fontSize: '1.4rem', 
                            color: stage.status === 'completed' ? '#4caf50' : stage.status === 'active' ? '#2196f3' : '#555',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '30px'
                        }}>
                            {stage.status === 'active' ? <FaSpinner style={{ animation: 'spin 2s linear infinite' }} /> : stage.icon}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', whiteSpace: 'nowrap', color: stage.status === 'pending' ? '#555' : 'inherit' }}>{stage.label}</div>
                        {stage.status === 'active' && (stage.id === 'domain' || stage.id === 'sfu_test') && (
                            <div style={{ 
                                width: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                marginTop: '3px'
                            }}>
                                <div style={{ 
                                    width: '80%', 
                                    height: '3px', 
                                    background: 'rgba(255,255,255,0.1)', 
                                    borderRadius: '2px', 
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: `${progress.current}%`, 
                                        height: '100%', 
                                        background: '#2196f3', 
                                        transition: 'width 0.3s ease' 
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#2196f3', marginTop: '2px' }}>
                                    Cycle {progress.cycle}/{progress.totalCycles}
                                </div>
                            </div>
                        )}
                    </div>
                    {index < stages.length - 1 && (
                        <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: (stages[index].status === 'completed') ? '#4caf50' : 'rgba(255,255,255,0.2)',
                            fontSize: '1rem',
                            paddingBottom: (stages[index].status === 'active' || stages[index+1].status === 'active') ? '25px' : '15px',
                            flex: 0.2,
                            transition: 'all 0.3s ease'
                        }}>
                            <FaArrowRight />
                        </div>
                    )}
                </React.Fragment>
            ))}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
  };

  const renderDiagnosisResult = (results?: DiagnosisResult[]) => {
    if (!results) return null;
    return results.map((res, idx) => (
        <div key={idx} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4da6ff', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                <span>Target: {res.domain}</span>
                {res.dns.resolved && <span style={{ fontSize: '0.75rem', color: '#888' }}>{res.dns.addresses[0]}</span>}
            </div>
            {res.mtr.executed ? (
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#eee' }}>
                            <th style={{ padding: '4px' }}>Hop</th>
                            <th style={{ padding: '4px' }}>Host</th>
                            <th style={{ padding: '4px' }}>Loss%</th>
                            <th style={{ padding: '4px' }}>Min</th>
                            <th style={{ padding: '4px' }}>Max</th>
                            <th style={{ padding: '4px' }}>Avg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {res.mtr.hops.map((hop, hIdx) => (
                            <tr key={hIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '4px' }}>{hop.hop || hIdx + 1}</td>
                                <td style={{ padding: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={hop.host || hop.ip}>
                                    {hop.host || hop.ip}
                                </td>
                                <td style={{ padding: '4px', color: hop.loss > 10 ? '#ff4d4d' : hop.loss > 0 ? '#ff9800' : '#4caf50' }}>{hop.loss}%</td>
                                <td style={{ padding: '4px' }}>{hop.best}ms</td>
                                <td style={{ padding: '4px' }}>{hop.worst}ms</td>
                                <td style={{ padding: '4px' }}>{hop.avg}ms</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div style={{ fontSize: '0.8rem', color: '#ff4d4d', padding: '10px' }}>MTR Error: {res.mtr.error || 'Unknown error'}</div>
            )}
        </div>
    ));
  };

  const runDiagnosis = async (domains: string[], duration: number = 3) => {
    addLog(`Starting diagnosis for: ${domains.join(', ')}`);
    setProgress({ current: 0, cycle: 0, totalCycles: duration });
    try {
        const report: FullReport = await ipc.network.runDiagnosis({ domains, duration });
        if ((report as any).error) {
            addLog(`Diagnosis error: ${(report as any).error}`);
            return null;
        }
        return report;
    } catch (err: any) {
        addLog(`IPC Error: ${err.message}`);
        return null;
    }
  };

  const startTest = useCallback(async () => {
    if (isTesting) return;
    setIsTesting(true);
    setLogs([]);
    setReports({});
    setProgress({ current: 0, cycle: 0, totalCycles: 0 });
    setActiveTab('logs');
    setStages(prev => prev.map(s => ({ ...s, status: 'pending' })));

    addLog('Starting Network Diagnosis');
    updateStage('init', 'active');

    const env = ipc.env.get();
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

    // Step 1: Diagnose API and WS domains
    const domains = Array.from(new Set([apiDomain, wsDomain])).filter(Boolean);
    
    // Pre-initialize reports so live updates have a target
    setReports(prev => ({
        ...prev,
        domain: domains.map(d => ({
            domain: d,
            dns: { resolved: false, addresses: [], error: null },
            mtr: { executed: false, hops: [], error: null }
        }))
    }));

    const report1 = await runDiagnosis(domains, 3);
    if (report1) {
        setReports(prev => ({ ...prev, domain: report1.diagnosis }));
        addLog('--- Domain Diagnosis Completed ---');
        updateStage('domain', 'completed');
    } else {
        updateStage('domain', 'failed');
    }

    addLog('Checking SFU Connection...');
    updateStage('sfu_info', 'active');
    
    try {
      ipc.sfuDiagnosis.request();
      
      const unsubscribe = ipc.sfuDiagnosis.onResponse(async (data: any) => {
        unsubscribe();
        
        if (data && data.ip) {
          addLog(`SFU Connected: ${data.ip}:${data.port}`);
          updateStage('sfu_info', 'completed');
          updateStage('sfu_test', 'active');
          
          // Step 2: Diagnose SFU direct connection
          addLog(`Starting diagnosis for SFU: ${data.ip}`);
          
          setReports(prev => ({
              ...prev,
              sfu: [{
                  domain: data.ip,
                  dns: { resolved: true, addresses: [data.ip], error: null },
                  mtr: { executed: false, hops: [], error: null }
              }]
          }));

          const report2 = await runDiagnosis([data.ip], 5);
          if (report2) {
              setReports(prev => ({ ...prev, sfu: report2.diagnosis }));
              updateStage('sfu_test', 'completed');
              setActiveTab('reports'); // Auto switch to reports when done
          } else {
              updateStage('sfu_test', 'failed');
          }
        } else {
          addLog('No active SFU connection found.');
          updateStage('sfu_info', 'failed');
        }
        addLog(t('diagnosis-finished'));
        setIsTesting(false);
      });

    } catch (e: any) {
      addLog(`Error requesting SFU info: ${e.message}`);
      updateStage('sfu_info', 'failed');
      setIsTesting(false);
    }

  }, [isTesting, addLog, t, updateStage]);

  const exportReport = useCallback(() => {
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
      reports.domain.forEach(res => {
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
      reports.sfu.forEach(res => {
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

  return (
    <div className={styles['popup-wrapper']}>
      <div className={styles['popup-body']}>
         <div style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', height: '100%', gap: '5px', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <h2 style={{ fontSize: '1.1rem' }}>{t('network-diagnosis')}</h2>
            </div>
            
            {renderVisualProgress()}

            {/* Tab Header */}
            <div style={{ display: 'flex', gap: '5px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                <div 
                    onClick={() => setActiveTab('logs')}
                    style={{ 
                        padding: '8px 20px', 
                        cursor: 'pointer', 
                        fontSize: '0.85rem',
                        fontWeight: activeTab === 'logs' ? 'bold' : 'normal',
                        color: activeTab === 'logs' ? '#2196f3' : '#aaa',
                        borderBottom: activeTab === 'logs' ? '2px solid #2196f3' : '2px solid transparent',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {t('diagnosis-logs')}
                </div>
                <div 
                    onClick={() => setActiveTab('reports')}
                    style={{ 
                        padding: '8px 20px', 
                        cursor: 'pointer', 
                        fontSize: '0.85rem',
                        fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                        color: activeTab === 'reports' ? '#2196f3' : '#aaa',
                        borderBottom: activeTab === 'reports' ? '2px solid #2196f3' : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    {t('diagnosis-reports')}
                    {(reports.domain || reports.sfu) && <div style={{ width: '6px', height: '6px', background: '#4caf50', borderRadius: '50%' }} />}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'logs' ? (
                    <div 
                        ref={scrollRef}
                        style={{ 
                            flex: 1, 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '12px', 
                            borderRadius: '5px', 
                            overflowY: 'auto', 
                            fontFamily: 'monospace', 
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            userSelect: 'text',
                            WebkitUserSelect: 'text'
                        }}
                    >
                        {logs.length === 0 ? <div style={{ color: '#888' }}>Click "Start Test" to begin...</div> : logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '3px', borderBottom: '1px solid rgba(255,255,255,0.03)', userSelect: 'text', WebkitUserSelect: 'text' }}>{log}</div>
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        flex: 1, 
                        background: 'rgba(0,0,0,0.35)', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        overflowY: 'auto', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                    }}>
                        {!reports.domain && !reports.sfu && (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexDirection: 'column', gap: '10px' }}>
                                <FaSpinner style={{ animation: 'spin 2s linear infinite', fontSize: '1.5rem' }} />
                                <span>{t('Diagnosis in progress...')}</span>
                            </div>
                        )}
                        {reports.domain && (
                            <>
                                <div style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaCloud /> API / WEBSOCKET SERVER
                                </div>
                                {renderDiagnosisResult(reports.domain)}
                            </>
                        )}
                        {reports.sfu && (
                            <>
                                <div style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'bold', marginBottom: '10px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      <div className={styles['popup-footer']}>
        <div 
          className={styles['button']} 
          onClick={exportReport} 
          style={{ 
            opacity: logs.length === 0 || isTesting ? 0.5 : 1, 
            pointerEvents: logs.length === 0 || isTesting ? 'none' : 'auto',
            marginRight: 'auto'
          }}
        >
          {t('export-report')}
        </div>
        <div className={styles['button']} onClick={startTest} style={{ opacity: isTesting ? 0.5 : 1, pointerEvents: isTesting ? 'none' : 'auto' }}>
          {isTesting ? t('testing') : t('start-test')}
        </div>
        <div className={styles['button']} onClick={() => ipc.window.close()}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

NetworkDiagnosis.displayName = 'NetworkDiagnosis';

export default NetworkDiagnosis;