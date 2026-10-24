import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  FileCode2,
  HardDrive,
  Send,
  HelpCircle,
  Flame
} from 'lucide-react';
import { LandPass, VillageConfig, UserProfile, AuditLog } from '../types';
import {
  getPhpStorageConfig,
  savePhpStorageConfig,
  testPhpConnection,
  transferAllDataToPHP,
  downloadMySqlDumpFile,
  DEFAULT_PHP_URL,
  PhpConnectionResult
} from '../services/phpStorageService';

interface PhpStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  passes: LandPass[];
  villages: VillageConfig[];
  users: UserProfile[];
  logs?: AuditLog[];
  onNotify: (message: string, type: 'success' | 'info' | 'warn') => void;
}

export const PhpStorageModal: React.FC<PhpStorageModalProps> = ({
  isOpen,
  onClose,
  passes,
  villages,
  users,
  logs = [],
  onNotify,
}) => {
  const [config, setConfig] = useState(getPhpStorageConfig());
  const [testResult, setTestResult] = useState<PhpConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState<'standalone_app' | 'status' | 'code_api' | 'code_config' | 'code_schema' | 'guide'>('standalone_app');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getPhpStorageConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (updates: Partial<typeof config>) => {
    const updated = savePhpStorageConfig(updates);
    setConfig(updated);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testPhpConnection(config.apiUrl);
      setTestResult(result);
      if (result.success) {
        onNotify('Connected to PHP Storage Backend successfully!', 'success');
      } else {
        onNotify(result.message, 'warn');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleTransferToPhp = async () => {
    setTransferring(true);
    try {
      const res = await transferAllDataToPHP(passes, villages, users, logs);
      if (res.success) {
        onNotify(res.message, 'success');
        // Re-test to update record count
        handleTestConnection();
      } else {
        onNotify(res.message, 'warn');
      }
    } catch (e: any) {
      onNotify(`PHP Transfer error: ${e?.message || e}`, 'warn');
    } finally {
      setTransferring(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
    onNotify(`Copied ${label} to clipboard!`, 'info');
  };

  const handleDownloadDump = () => {
    downloadMySqlDumpFile(passes, villages, users, logs);
    onNotify('MySQL database dump (.sql) downloaded successfully!', 'success');
  };

  const handleDownloadPhpZip = () => {
    // Generate downloadable files package info
    const files = [
      { name: 'schema.sql', path: '/php-backend/schema.sql' },
      { name: 'config.php', path: '/php-backend/config.php' },
      { name: 'api.php', path: '/php-backend/api.php' },
      { name: 'install.php', path: '/php-backend/install.php' },
      { name: '.htaccess', path: '/php-backend/.htaccess' },
      { name: 'README.md', path: '/php-backend/README.md' },
    ];

    files.forEach((f) => {
      const a = document.createElement('a');
      a.href = f.path;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    onNotify('PHP backend files downloaded to your device.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-neutral-950 text-white flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-purple-900/70 border border-purple-500/40 rounded-2xl shadow-inner">
              <Server className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg tracking-wide text-white">
                  PHP &amp; MySQL Storage Backend
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                  cPanel / XAMPP / Apache Ready
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Change storage data into PHP scripts and relational MySQL database for self-hosted servers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 bg-neutral-50 border-b border-neutral-200 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('standalone_app')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'standalone_app'
                ? 'border-emerald-600 text-emerald-950 font-bold bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-700" />
            <span>Standalone PHP &amp; MySQL App (For Another Domain)</span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-purple-600 text-purple-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Dual Sync &amp; API Transfer</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'guide'
                ? 'border-purple-600 text-purple-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>How to Host on cPanel / XAMPP</span>
          </button>
          <button
            onClick={() => setActiveTab('code_api')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition font-mono ${
              activeTab === 'code_api'
                ? 'border-purple-600 text-purple-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>api.php</span>
          </button>
          <button
            onClick={() => setActiveTab('code_config')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition font-mono ${
              activeTab === 'code_config'
                ? 'border-purple-600 text-purple-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>config.php</span>
          </button>
          <button
            onClick={() => setActiveTab('code_schema')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition font-mono ${
              activeTab === 'code_schema'
                ? 'border-purple-600 text-purple-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>schema.sql</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 0: STANDALONE PHP & MYSQL WEB APPLICATION */}
          {activeTab === 'standalone_app' && (
            <div className="space-y-6">
              {/* Main Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-neutral-900 text-white border-2 border-emerald-500/50 shadow-md space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-800 rounded-xl">
                      <Server className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">
                        Standalone PHP, MySQL, HTML &amp; CSS Application
                      </h3>
                      <p className="text-xs text-emerald-300">
                        100% Self-Hosted &bull; Zero JavaScript Framework &bull; Zero Firebase &bull; All Data Stored in Local MySQL
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full font-mono font-bold uppercase">
                    Ready for Another Domain
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Your application has been converted into standard <strong>PHP, MySQL, HTML5, and CSS3</strong>. You can upload this entire package to any domain web hosting (cPanel, XAMPP, Apache, Shared Hosting, or VPS). All Land Passes, Village profiles, User accounts, and Audit logs are stored directly in your local MySQL database.
                </p>

                {/* 3 Download Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <a
                    href="/php-app/landpass_php_mysql_app.tar.gz"
                    download="landpass_php_mysql_app.tar.gz"
                    className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full App (.tar.gz)</span>
                  </a>

                  <a
                    href="/php-app/schema.sql"
                    download="schema.sql"
                    className="p-3 bg-emerald-900 hover:bg-emerald-800 border border-emerald-600/60 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <HardDrive className="w-4 h-4 text-emerald-300" />
                    <span>Download schema.sql</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleDownloadDump}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Database className="w-4 h-4 text-amber-300" />
                    <span>Export Live Data (.sql)</span>
                  </button>
                </div>
              </div>

              {/* 3-Step Hosting Instructions */}
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3-Step Deployment Guide for Another Domain / Web Hosting</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
                    <strong className="text-neutral-900 font-bold block">Step 1: Upload to Web Host</strong>
                    <p className="text-neutral-600 leading-relaxed">
                      Download the <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">landpass_php_mysql_app.tar.gz</code> archive and extract all files into your domain's <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">public_html/</code> folder via cPanel File Manager or FTP.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
                    <strong className="text-neutral-900 font-bold block">Step 2: Run 1-Click Installer</strong>
                    <p className="text-neutral-600 leading-relaxed">
                      Open your web browser and navigate to:
                      <br />
                      <code className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1 py-0.5 rounded block mt-1">
                        https://your-domain.com/install.php
                      </code>
                      Enter your MySQL Database Name, User, and Password, and click <strong>Install</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
                    <strong className="text-neutral-900 font-bold block">Step 3: Ready for Use!</strong>
                    <p className="text-neutral-600 leading-relaxed">
                      Log in as <strong>Full Authority</strong> using Master Key <code className="font-mono bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">785392</code>, or register new secretaries to issue passes with custom starting numbers!
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete PHP File Inventory */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Included PHP, HTML, CSS &amp; MySQL Application Files
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">15 files &bull; Pure PHP/MySQL</span>
                </div>
                <div className="divide-y divide-neutral-100 text-xs">
                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">index.php</strong>
                      <p className="text-neutral-500 text-[11px]">Public portal with Land Pass serial number verification and login cards</p>
                    </div>
                    <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono font-bold">Public View</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">dashboard.php</strong>
                      <p className="text-neutral-500 text-[11px]">Secretary registry showing only user's passes, search filters (All, Huan Ram, In Hmun), and statistics</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Secretary</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">issue_pass.php</strong>
                      <p className="text-neutral-500 text-[11px]">Server-side form with automatic sequential pass numbering based on starting numbers and boundaries</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Secretary</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">print_pass.php</strong>
                      <p className="text-neutral-500 text-[11px]">Pure HTML/CSS official A4 certificate print engine with official council rubber seal box and signatures</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">A4 Print</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">village_profile.php</strong>
                      <p className="text-neutral-500 text-[11px]">Configure Council Name, Starting Numbers (1001), Prefixes, President Name, Logo upload, and Bylaws</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Council Settings</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">authority.php</strong>
                      <p className="text-neutral-500 text-[11px]">Master Authority panel (Key 785392) to review registrations, verify ₹299 lifetime fee, and approve accounts</p>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-mono font-bold">Master Authority</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">config.php &amp; schema.sql</strong>
                      <p className="text-neutral-500 text-[11px]">PDO MySQL connection bootstrap, session security, auto-number generation, and MySQL relational tables</p>
                    </div>
                    <span className="text-[10px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-mono font-bold">Core / DB</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">style.css</strong>
                      <p className="text-neutral-500 text-[11px]">Pure CSS3 styling with official Mizoram Government palette and @media print A4 certificate styles</p>
                    </div>
                    <span className="text-[10px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-mono font-bold">CSS3</span>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-neutral-50">
                    <div className="space-y-0.5">
                      <strong className="font-mono text-emerald-900">install.php</strong>
                      <p className="text-neutral-500 text-[11px]">1-Click graphical installer to test MySQL connection, create tables, and configure config.php automatically</p>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-mono font-bold">Installer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: CONNECTION & TRANSFER */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Architecture comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span>Firebase Realtime Database</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      Active Cloud Sync
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Provides zero-latency live synchronization across devices and offline caching in IndexedDB.
                  </p>
                  <div className="text-[11px] text-amber-800 font-medium">
                    Current records: <strong>{passes.length}</strong> Land Passes, <strong>{villages.length}</strong> Villages
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-purple-700" />
                      <span>PHP &amp; MySQL Storage Engine</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      config.enabled ? 'bg-purple-200 text-purple-950' : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {config.enabled ? 'Enabled' : 'Configurable'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    Stores all Land Passes, Villages, Users, and Logs in standard PHP scripts and relational MySQL tables.
                  </p>
                  <div className="text-[11px] text-purple-800 font-medium">
                    {testResult?.databaseConnected 
                      ? `Connected to MySQL: ${testResult.counts?.passes || 0} passes stored`
                      : 'Self-hosted or shared server (Apache / Nginx / cPanel)'}
                  </div>
                </div>
              </div>

              {/* Endpoint Configuration Box */}
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    PHP REST API Endpoint URL
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleSaveConfig({ enabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-neutral-800">
                      Enable Dual Sync to PHP Backend
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={config.apiUrl}
                      onChange={(e) => handleSaveConfig({ apiUrl: e.target.value })}
                      placeholder="e.g. http://localhost/php-backend/api.php or https://your-council.gov.in/api.php"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Pinging PHP...' : 'Test Connection'}</span>
                  </button>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-4 rounded-xl text-xs space-y-1.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border border-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.success && testResult.counts && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 font-mono text-[11px]">
                        <div>Storage: <strong>{testResult.storageEngine}</strong></div>
                        <div>Passes: <strong>{testResult.counts.passes}</strong></div>
                        <div>Villages: <strong>{testResult.counts.villages}</strong></div>
                        <div>Users: <strong>{testResult.counts.users}</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTransferToPhp}
                  disabled={transferring}
                  className="p-3.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${transferring ? 'animate-pulse' : ''}`} />
                  <span>
                    {transferring
                      ? 'Transferring Records...'
                      : `Transfer All Data to PHP Backend (${passes.length} Passes)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDump}
                  className="p-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download MySQL Database Dump (.sql)</span>
                </button>
              </div>

              {/* Full PHP Backend Download */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-purple-700" />
                    <span>Download Standalone PHP Backend Package</span>
                  </h4>
                  <p className="text-[11px] text-purple-900/80">
                    Includes <code className="font-mono">api.php</code>, <code className="font-mono">config.php</code>, <code className="font-mono">schema.sql</code>, <code className="font-mono">install.php</code>, and <code className="font-mono">.htaccess</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPhpZip}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PHP Package</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5 text-neutral-800 leading-relaxed text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-emerald-950 text-sm mb-1">
                  How PHP Backend Storage Works
                </h4>
                <p className="text-emerald-900 text-xs">
                  This web app is a modern React frontend that connects to either Firebase or any standard PHP server. When you use the PHP backend, all Land Pass certificates, Village bylaws, Users, and Audit logs are stored directly in your MySQL database via standard PHP REST API calls.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-900 border-b pb-2">
                  Step-by-Step Installation on cPanel / Shared Hosting
                </h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Download the PHP Backend files:</strong> Click the "Download PHP Package" button to download <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">api.php</code>, <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">config.php</code>, <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">schema.sql</code>, and <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">install.php</code>.
                  </li>
                  <li>
                    <strong>Upload to your server:</strong> In cPanel File Manager or via FTP, upload the folder to your web root (e.g., <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">public_html/php-backend/</code>).
                  </li>
                  <li>
                    <strong>Run 1-Click Installer:</strong> Open your web browser and visit:
                    <div className="mt-1 p-2 bg-neutral-100 rounded-lg font-mono text-[11px] text-purple-950 font-bold">
                      http://your-domain.com/php-backend/install.php
                    </div>
                    Enter your MySQL database name, username, and password, and click <strong>"Install / Create MySQL Tables"</strong>.
                  </li>
                  <li>
                    <strong>Connect the App:</strong> In this modal, paste your URL:
                    <div className="mt-1 p-2 bg-neutral-100 rounded-lg font-mono text-[11px] text-emerald-950 font-bold">
                      http://your-domain.com/php-backend/api.php
                    </div>
                    Click <strong>"Test Connection"</strong> &rarr; then click <strong>"Transfer All Data to PHP Backend"</strong>!
                  </li>
                </ol>
              </div>

              <div className="space-y-4 pt-3 border-t">
                <h4 className="font-bold text-sm text-neutral-900 border-b pb-2">
                  Running Locally on XAMPP / WampServer
                </h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Start Apache and MySQL in your XAMPP Control Panel.</li>
                  <li>Copy the <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">php-backend</code> folder into <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">C:/xampp/htdocs/php-backend/</code>.</li>
                  <li>Open <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">http://localhost/php-backend/install.php</code> in your browser to create the MySQL tables automatically.</li>
                  <li>In this modal, enter: <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">http://localhost/php-backend/api.php</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: CODE VIEWER api.php */}
          {activeTab === 'code_api' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neutral-700">api.php (REST API Router)</span>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/php-backend/api.php')
                      .then((r) => r.text())
                      .then((txt) => handleCopy(txt, 'api.php'));
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedCode === 'api.php' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'api.php' ? 'Copied!' : 'Copy api.php'}</span>
                </button>
              </div>
              <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-neutral-800">
{`<?php
/**
 * Village Council Land Pass Management System
 * Production PHP REST API Storage Endpoint
 * 
 * Supports: get_passes, save_pass, delete_pass,
 * get_villages, save_village, get_users, save_user,
 * get_logs, log_activity, transfer_all, export_sql
 */
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$payload = json_decode(file_get_contents('php://input'), true) ?: [];

$pdo = Database::getConnection();

switch ($action) {
    case 'status':
        jsonResponse([
            'success' => true,
            'status' => 'online',
            'php_version' => PHP_VERSION,
            'storage_engine' => $pdo ? 'MySQL' : 'JSON Flat File',
            'database_connected' => $pdo !== null,
        ]);
        break;

    case 'save_pass':
        // Saves Land Pass with starting numbers & village prefixes
        // Insert into land_passes on duplicate key update...
        break;

    case 'transfer_all':
        // Bulk imports all passes, villages, users, logs
        break;
}`}
              </pre>
            </div>
          )}

          {/* TAB 4: CODE VIEWER config.php */}
          {activeTab === 'code_config' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neutral-700">config.php (Database Connection)</span>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/php-backend/config.php')
                      .then((r) => r.text())
                      .then((txt) => handleCopy(txt, 'config.php'));
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedCode === 'config.php' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'config.php' ? 'Copied!' : 'Copy config.php'}</span>
                </button>
              </div>
              <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-neutral-800">
{`<?php
// CORS Headers for React Frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=UTF-8');

// Update with your MySQL credentials in cPanel / XAMPP
define('DB_HOST', 'localhost');
define('DB_NAME', 'landpass_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');

// Auto-fallback to JSON files in ./data/ if MySQL is not configured yet!
class Database {
    public static function getConnection(): ?PDO { ... }
}`}
              </pre>
            </div>
          )}

          {/* TAB 5: CODE VIEWER schema.sql */}
          {activeTab === 'code_schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neutral-700">schema.sql (MySQL Tables)</span>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/php-backend/schema.sql')
                      .then((r) => r.text())
                      .then((txt) => handleCopy(txt, 'schema.sql'));
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedCode === 'schema.sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'schema.sql' ? 'Copied!' : 'Copy schema.sql'}</span>
                </button>
              </div>
              <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-neutral-800">
{`CREATE TABLE IF NOT EXISTS \`villages\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`village_name\` VARCHAR(255) NOT NULL,
  \`huan_ram_prefix\` VARCHAR(50) DEFAULT 'MZ-VC-HR-',
  \`in_hmun_prefix\` VARCHAR(50) DEFAULT 'MZ-VC-IH-',
  \`starting_pass_number\` INT DEFAULT 1001,
  \`starting_huan_ram_number\` INT DEFAULT 1001,
  \`starting_in_hmun_number\` INT DEFAULT 1001,
  \`logo_url\` MEDIUMTEXT DEFAULT NULL,
  \`emblem_logo_url\` MEDIUMTEXT DEFAULT NULL,
  \`conditions_and_terms\` MEDIUMTEXT DEFAULT NULL,
  \`president_name\` VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS \`land_passes\` (
  \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`pass_number\` VARCHAR(100) NOT NULL,
  \`pass_type\` ENUM('huan_ram', 'in_hmun') NOT NULL,
  \`owner_name\` VARCHAR(255) NOT NULL,
  \`parent_name\` VARCHAR(255) DEFAULT '',
  \`contact_number\` VARCHAR(50) DEFAULT '',
  \`village_id\` VARCHAR(100) NOT NULL,
  \`area_dimension\` VARCHAR(150) DEFAULT '',
  \`boundary_north\` TEXT DEFAULT NULL,
  \`boundary_east\` TEXT DEFAULT NULL,
  \`boundary_west\` TEXT DEFAULT NULL,
  \`boundary_south\` TEXT DEFAULT NULL,
  \`issue_date\` DATE NOT NULL,
  \`approval_status\` ENUM('live', 'pending_approval', 'revoked') DEFAULT 'live'
);`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-xs text-neutral-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All records can be synchronized to both Firebase and PHP MySQL simultaneously.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
