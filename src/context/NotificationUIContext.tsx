import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventEmitter } from 'eventemitter3';
import { NotificationListenerService } from '../notification/NotificationListenerService';

type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';
type NotificationUIState = {
  status: ProcessingStatus;
  message: string | null;
  lastProcessedTransaction?: any;
};

const NotificationUIContext = createContext<{
  state: NotificationUIState;
  clearStatus: () => void;
}>({
  state: { status: 'idle', message: null },
  clearStatus: () => {},
});

export const useNotificationUI = () => useContext(NotificationUIContext);

export const NotificationUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationUIState>({ status: 'idle', message: null });

  useEffect(() => {
    const eventBus = NotificationListenerService.getEventBus();

    const onStart = (text: string) => {
      setState({ status: 'processing', message: `Processing: "${text.substring(0, 50)}..."`, lastProcessedTransaction: undefined });
    };
    const onSuccess = (transaction: any) => {
      setState({ status: 'success', message: 'Transaction automatically added!', lastProcessedTransaction: transaction });
      // Auto‑clear after 3 seconds
      setTimeout(() => setState({ status: 'idle', message: null }), 3000);
    };
    const onError = (error: string) => {
      setState({ status: 'error', message: `Failed: ${error}`, lastProcessedTransaction: undefined });
      setTimeout(() => setState({ status: 'idle', message: null }), 4000);
    };

    eventBus.on('ai:processing-start', onStart);
    eventBus.on('ai:transaction-created', onSuccess);
    eventBus.on('ai:processing-error', onError);

    return () => {
      eventBus.off('ai:processing-start', onStart);
      eventBus.off('ai:transaction-created', onSuccess);
      eventBus.off('ai:processing-error', onError);
    };
  }, []);

  const clearStatus = () => setState({ status: 'idle', message: null });

  return (
    <NotificationUIContext.Provider value={{ state, clearStatus }}>
      {children}
    </NotificationUIContext.Provider>
  );
};