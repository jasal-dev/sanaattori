'use client';

import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const setModalOpen = (open: boolean) => {
    setIsAnyModalOpen(open);
  };

  return (
    <ModalContext.Provider value={{ isAnyModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
