"use client";
import { useEffect } from "react";
import { CheckCircle, X, AlertCircle, Info } from "lucide-react";

export default function Toaster({ toasts, onRemove }) {
  // Auto-scroll to newest toast
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        const newestToast = document.querySelector('[data-toast-newest="true"]');
        if (newestToast) {
          newestToast.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-white" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-white" />;
      case "info":
        return <Info className="w-5 h-5 text-white" />;
      default:
        return <Info className="w-5 h-5 text-black" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-500 border-green-300 text-white";
      case "error":
        return "bg-red-500 border-red-300 text-white";
      case "info":
        return "bg-blue-500 border-blue-300 text-white";
      default:
        return "bg-gray-500 border-gray-300 text-black";
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          data-toast-newest={index === toasts.length - 1}
          className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 transform ${getToastStyles(
            toast.type
          )} ${
            index === toasts.length - 1
              ? "translate-x-0 opacity-100"
              : "translate-x-0 opacity-90"
          }`}
        >
          {getToastIcon(toast.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight wrap-break-word">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
}
