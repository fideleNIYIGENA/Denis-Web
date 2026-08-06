import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCircleCheck, FaCircleExclamation, FaCircleInfo, FaXmark } from 'react-icons/fa6';

const ToastContext = createContext({ show: () => {} });

let nextId = 0;

/** Global toast notifications. Wrap the app with <ToastProvider>. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'success') => {
    const toast = { id: ++nextId, message, type };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => dismiss(toast.id), 4500);
  }, [dismiss]);

  const icons = {
    success: <FaCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />,
    error: <FaCircleExclamation className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />,
    info: <FaCircleInfo className="mt-0.5 h-4 w-4 shrink-0 text-gold" />,
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-night-700 p-4 text-sm text-white shadow-card-dark"
            >
              {icons[t.type] || icons.info}
              <span className="flex-1">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-slate-400 transition hover:text-white">
                <FaXmark className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
