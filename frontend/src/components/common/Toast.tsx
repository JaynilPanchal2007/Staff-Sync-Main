import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border p-3.5 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
      <div className="shrink-0">
        {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        {isError && <AlertCircle className="h-5 w-5 text-rose-500" />}
        {!isSuccess && !isError && <Info className="h-5 w-5 text-indigo-500" />}
      </div>
      <div className="flex-1 text-xs font-semibold leading-relaxed">
        {toast.message}
      </div>
    </div>
  );
};
