import Modal from './Modal.jsx';
import { FaTriangleExclamation } from 'react-icons/fa6';

/** Danger confirmation dialog for destructive actions. */
export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirming = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <FaTriangleExclamation className="h-6 w-6" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-2 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {confirming ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
