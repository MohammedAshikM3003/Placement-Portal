import { useState, useCallback } from 'react';

/**
 * useConfirmDialog
 * Manages open/close state and the target item for a ConfirmDialog.
 *
 * Usage:
 *   const { isOpen, item, open, close, confirm } = useConfirmDialog();
 *
 *   <button onClick={() => open(row)}>Delete</button>
 *   <ConfirmDialog
 *     isOpen={isOpen}
 *     onConfirm={() => { handleDelete(item); close(); }}
 *     onCancel={close}
 *   />
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [item,   setItem]   = useState(null);

  const open    = useCallback((target = null) => { setItem(target); setIsOpen(true); },  []);
  const close   = useCallback(() => { setIsOpen(false); setItem(null); }, []);
  const confirm = useCallback((onConfirm) => { if (onConfirm) onConfirm(item); close(); }, [item, close]);

  return { isOpen, item, open, close, confirm };
}

export default useConfirmDialog;
