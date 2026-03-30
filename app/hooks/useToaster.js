"use client";
import { useState, useCallback } from "react";

export function useToaster() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const showSuccess = useCallback((message, duration = 5000) => {
    addToast(message, "success", duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 5000) => {
    addToast(message, "error", duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 5000) => {
    addToast(message, "info", duration);
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showSuccess,
    showError,
    showInfo,
    removeToast,
    clearAll,
  };
}

export default useToaster;
