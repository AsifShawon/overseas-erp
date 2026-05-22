"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PromptDialog from "@/components/ui/PromptDialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

interface PromptOptions {
  title: string;
  description: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

interface PromptState extends PromptOptions {
  isOpen: boolean;
  resolve: (value: string | null) => void;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = () => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  };

  const handleConfirmOk = () => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  };

  const handlePromptClose = () => {
    if (promptState) {
      promptState.resolve(null);
      setPromptState(null);
    }
  };

  const handlePromptSubmit = (val: string) => {
    if (promptState) {
      promptState.resolve(val);
      setPromptState(null);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}

      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          onClose={handleConfirmClose}
          onConfirm={handleConfirmOk}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          isDanger={confirmState.isDanger}
        />
      )}

      {promptState && (
        <PromptDialog
          isOpen={promptState.isOpen}
          onClose={handlePromptClose}
          onSubmit={handlePromptSubmit}
          title={promptState.title}
          description={promptState.description}
          placeholder={promptState.placeholder}
          defaultValue={promptState.defaultValue}
          confirmLabel={promptState.confirmLabel}
          cancelLabel={promptState.cancelLabel}
          isDanger={promptState.isDanger}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
export default DialogProvider;
