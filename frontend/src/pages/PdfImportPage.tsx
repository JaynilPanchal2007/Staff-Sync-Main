import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Sparkles,
  Trash2,
  ExternalLink,
  FileText,
  Clock,
  Layers,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface UploadEntry {
  id: string;
  fileName: string;
  originalName: string;
  publicUrl: string;
  type: 'staff' | 'timetable';
  uploadedAt: string;
  rowCount: number;
  imported: boolean;
  insertedCount?: number;
}

export const PdfImportPage: React.FC = () => {
  const { orgType, triggerRefresh } = useApp();

  const [importType, setImportType] = useState<'staff' | 'timetable'>('staff');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [sampleRaw, setSampleRaw] = useState<string[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload library
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  const isIndustry = orgType === 'industry';

  const fetchUploads = useCallback(async () => {
    try {
      const res = await api.getPdfUploads();
      setUploads(res.uploads || []);
    } catch {
      // silently fail
    } finally {
      setLoadingUploads(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleFileChange = (f: File) => {
    setFile(f);
    setPreviewData(null);
    setImportResult(null);
    setErrorMsg(null);
    setCurrentFileId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.pdf')) handleFileChange(dropped);
    else setErrorMsg('Only PDF files are accepted.');
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadPdf(file, importType);
      if (res.success) {
        if (res.type) setImportType(res.type);
        setPreviewData(res.preview || []);
        setSampleRaw(res.rawSample || []);
        setCurrentFileId(res.fileId || null);
        // Refresh library
        fetchUploads();
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.length === 0) return;
    setIsSaving(true);
    try {
      const res = await api.confirmPdfImport(importType, previewData, currentFileId ?? undefined);
      setImportResult({ count: res.insertedCount, errors: res.errors || [] });
      setPreviewData(null);
      setCurrentFileId(null);
      setFile(null);
      fetchUploads();
      triggerRefresh();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUpload = async (id: string) => {
    try {
      await api.deletePdfUpload(id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PDF Import Studio</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Upload faculty rosters, workforce lists, or timetable schedules in PDF format. Text is parsed
          into a structured preview table for review before any database commit.
        </p>
      </div>

      {/* ── Import Type Selector ── */}
      <div className="flex gap-3">
        {(['staff', 'timetable'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setImportType(t); setPreviewData(null); setImportResult(null); }}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
              importType === t
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {t === 'staff'
              ? (isIndustry ? 'Employee / Workforce Roster PDF' : 'Faculty / Staff Directory PDF')
              : 'Lecture Timetable PDF'}
          </button>
        ))}
      </div>

      {/* ── Drop Zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
            : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900/40'
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Upload className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
          {file ? file.name : 'Select or drag & drop a PDF document'}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Supports multi-page PDF documents up to 10 MB. Text parsing extracts tabular structures.
        </p>

        <div className="mt-4 flex justify-center gap-3">
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span>Browse Computer</span>
            <input type="file" accept=".pdf" onChange={handleInputChange} className="hidden" />
          </label>

          {file && (
            <button
              onClick={handleUploadAndParse}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Uploading & Parsing...' : 'Upload & Parse PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Message ── */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Success Banner ── */}
      {importResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold">
              Successfully imported {importResult.count} record(s) to database!
            </h4>
          </div>
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
            Records are now active and fully synchronised with the Smart Replacement Engine.
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-700 dark:text-amber-400">
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* ── Preview Table ── */}
      {previewData && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Verification Mode
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Extracted {previewData.length} Row(s)
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Review the parsed records below. Click Confirm to save to the database.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Writing to DB...' : 'Confirm & Commit to Database'}</span>
            </button>
          </div>

          {previewData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-sm font-semibold">No structured rows could be extracted.</p>
              <p className="max-w-md text-xs text-slate-400">
                The PDF may be image-based, scanned, or use an unusual layout. Make sure your PDF
                contains selectable text and uses a table or delimited format (comma, tab, or pipe-separated).
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-x-auto overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                  {importType === 'staff' ? (
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Email</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-2.5">Day</th>
                      <th className="px-4 py-2.5">Time</th>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Room</th>
                      <th className="px-4 py-2.5">Class</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {importType === 'staff' ? (
                        <>
                          <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">{row.name}</td>
                          <td className="px-4 py-2 text-slate-500">{row.employeeId}</td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.department}</td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.role}</td>
                          <td className="px-4 py-2 text-slate-400">{row.email}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">{row.day}</td>
                          <td className="px-4 py-2 text-slate-500">{row.startTime} – {row.endTime}</td>
                          <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{row.subject}</td>
                          <td className="px-4 py-2 text-slate-500">{row.room}</td>
                          <td className="px-4 py-2 text-slate-500">{row.classGrade}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Library ── */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Library</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {uploads.length}
            </span>
          </div>
          <button
            onClick={fetchUploads}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {loadingUploads ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading uploads…
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
            <FileText className="h-8 w-8 opacity-40" />
            <p className="text-xs">No PDFs have been uploaded yet.</p>
            <p className="text-[11px] text-slate-400">Upload a PDF above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {uploads.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>

                  {/* Meta */}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {u.originalName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        u.type === 'staff'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300'
                      }`}>
                        {u.type === 'staff' ? 'Staff' : 'Timetable'}
                      </span>

                      {u.imported ? (
                        <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Imported ({u.insertedCount ?? u.rowCount} rows)
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          <Clock className="h-2.5 w-2.5" />
                          Pending ({u.rowCount} rows parsed)
                        </span>
                      )}

                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(u.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={u.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={u.originalName}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                  <a
                    href={u.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteUpload(u.id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
