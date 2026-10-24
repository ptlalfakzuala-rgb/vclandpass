import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../services/auditLogger';
import {
  X,
  History,
  Search,
  Filter,
  Download,
  ShieldAlert,
  UserCheck,
  FilePlus2,
  FileEdit,
  Trash2,
  Printer,
  QrCode
} from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE_PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            <FilePlus2 className="w-3 h-3" /> Pass Created
          </span>
        );
      case 'UPDATE_PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
            <FileEdit className="w-3 h-3" /> Pass Updated
          </span>
        );
      case 'DELETE_PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
            <Trash2 className="w-3 h-3" /> Pass Deleted
          </span>
        );
      case 'PRINT_PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
            <Printer className="w-3 h-3" /> Pass Printed/PDF
          </span>
        );
      case 'ADMIN_ELEVATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
            <ShieldAlert className="w-3 h-3" /> Master Key (0000)
          </span>
        );
      case 'QR_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
            <QrCode className="w-3 h-3" /> QR Verified
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
            <UserCheck className="w-3 h-3" /> User Access
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
            {action}
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Target ID', 'Target Name', 'Performed By', 'Details'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.targetId}"`,
      `"${l.targetName}"`,
      `"${l.performedBy}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Saiphai_VC_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <History className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Council Activity &amp; Audit Trail</h3>
              <p className="text-xs text-emerald-200">
                Official tamper-evident log of all land passes and administrative events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition"
              title="Download CSV for archival"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-xs font-semibold text-neutral-600 shrink-0">Filter:</span>
            {['ALL', 'CREATE_PASS', 'UPDATE_PASS', 'DELETE_PASS', 'PRINT_PASS', 'ADMIN_ELEVATION'].map(
              (act) => (
                <button
                  key={act}
                  onClick={() => setActionFilter(act)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition ${
                    actionFilter === act
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {act === 'ALL' ? 'All Events' : act.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Log Entries List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              Loading Council Audit Logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No audit records found matching your filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-neutral-900">{log.targetName}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-600 font-mono text-[11px]">By {log.performedBy}</span>
                  </div>
                  <p className="text-neutral-700">{log.details}</p>
                </div>

                <div className="text-right shrink-0 text-neutral-500 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
          <span>Total Records: {filteredLogs.length} audit events logged</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
