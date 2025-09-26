// SSEContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SSEContext = createContext();

export const useSSE = () => {
  const ctx = useContext(SSEContext);
  if (!ctx) throw new Error('useSSE deve ser usado dentro de SSEProvider');
  return ctx;
};

export const SSEProvider = ({ children }) => {
  const { user, token } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);

  const controllerRef = useRef(null);
  const readerRef = useRef(null);
  const eventSourceRef = useRef(null); // compat
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // ms
  const eventListeners = useRef(new Map());

  // Em dev, prefira REACT_APP_API_URL; se vazio, usa IP da rede
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'http://10.0.50.79:8082';

  const clearReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const closeStream = useCallback(() => {
    try {
      readerRef.current?.cancel?.();
    } catch {}
    controllerRef.current?.abort?.();
    controllerRef.current = null;
    readerRef.current = null;

    setIsConnected(false);
    setConnectionStatus('disconnected');
    eventSourceRef.current = null;
  }, []);

  // Reconexão com backoff + jitter
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionStatus('failed');
      toast.error('Falha na conexão em tempo real. Recarregue a página.', {
        position: 'bottom-right',
        autoClose: false
      });
      return;
    }
    const jitter = Math.floor(Math.random() * 250);
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current) + jitter;

    setConnectionStatus('reconnecting');
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      connect();
    }, delay);
  }, []); // intencionalmente sem connect nas deps para evitar loop

  // Parser SSE robusto (multilinha, CRLF, comentários)
  const parseSSEMessage = useCallback((rawChunk) => {
    const lines = rawChunk.split(/\r?\n/);
    let eventType = 'message';
    const dataLines = [];

    for (const line of lines) {
      if (!line || line.startsWith(':')) continue; // heartbeat/comentário
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (!dataLines.length) return;

    const dataStr = dataLines.join('\n');
    let parsed;
    try {
      parsed = JSON.parse(dataStr);
    } catch {
      parsed = dataStr; // pode não ser JSON
    }

    switch (eventType) {
      case 'connected':
        setStats(parsed);
        break;
      case 'heartbeat':
      case 'ping':
        // só mantém viva
        break;
      case 'notification': {
        setMessages((prev) => [...prev, parsed]);
        if (parsed?.showToast !== false) {
          toast.info(parsed?.message || 'Nova notificação', {
            position: 'bottom-right',
            autoClose: 5000
          });
        }
        break;
      }
      default:
        setMessages((prev) => [...prev, parsed]);
    }

    const listeners = eventListeners.current.get(eventType) || [];
    listeners.forEach((cb) => {
      try {
        cb(parsed);
      } catch (e) {
        console.error('Listener SSE falhou:', e);
      }
    });
  }, []);

  const connect = useCallback(async () => {
    if (!user || !token) return;
    if (
      connectionStatus === 'connecting' ||
      connectionStatus === 'connected' ||
      connectionStatus === 'reconnecting'
    ) {
      return;
    }

    clearReconnect();
    closeStream();
    setConnectionStatus('connecting');

    try {
      const sseUrl = `${API_BASE_URL}/api/sse/stream`;
      controllerRef.current = new AbortController();

      const resp = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          Authorization: `Bearer ${token}`
        },
        signal: controllerRef.current.signal
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      toast.dismiss();
      toast.success('Conexão em tempo real estabelecida', {
        position: 'bottom-right',
        autoClose: 2000
      });

      const reader = resp.body.getReader();
      readerRef.current = reader;

      eventSourceRef.current = {
        readyState: 1, // OPEN
        close: () => closeStream()
      };

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.trim()) parseSSEMessage(part);
        }
      }

      // servidor encerrou o stream
      setIsConnected(false);
      setConnectionStatus('disconnected');
      scheduleReconnect();
    } catch (err) {
      if (controllerRef.current?.signal.aborted) return; // fechamento intencional
      console.error('SSE: Erro ao criar/conduzir conexão:', err);
      setIsConnected(false);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, [user, token, API_BASE_URL, parseSSEMessage, connectionStatus, closeStream, scheduleReconnect]);

  const disconnect = useCallback(() => {
    clearReconnect();
    closeStream();
  }, [closeStream]);

  const on = useCallback((event, callback) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, []);
    }
    eventListeners.current.get(event).push(callback);
    return () => {
      const list = eventListeners.current.get(event) || [];
      const idx = list.indexOf(callback);
      if (idx > -1) list.splice(idx, 1);
    };
  }, []);

  const off = useCallback((event, callback) => {
    if (!eventListeners.current.has(event)) return;
    const list = eventListeners.current.get(event) || [];
    if (callback) {
      const idx = list.indexOf(callback);
      if (idx > -1) list.splice(idx, 1);
    } else {
      // Remove todos os listeners para este evento
      eventListeners.current.set(event, []);
    }
  }, []);

  const sendToUser = useCallback(
    async (userId, event, data) => {
      const r = await fetch(`${API_BASE_URL}/api/sse/notify/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ event, data })
      });
      if (!r.ok) throw new Error('Falha ao enviar notificação');
      return r.json();
    },
    [token, API_BASE_URL]
  );

  const broadcast = useCallback(
    async (event, data) => {
      console.log('🔊 SSE BROADCAST - Token disponível:', token ? 'Sim' : 'Não');
      console.log('🔊 SSE BROADCAST - Token preview:', token ? token.substring(0, 50) + '...' : 'null');
      
      const r = await fetch(`${API_BASE_URL}/api/sse/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ event, data })
      });
      
      console.log('📡 SSE BROADCAST - Status resposta:', r.status);
      
      if (!r.ok) {
        const errorText = await r.text();
        console.error('❌ SSE BROADCAST - Erro:', errorText);
        throw new Error('Falha ao enviar broadcast');
      }
      return r.json();
    },
    [token, API_BASE_URL]
  );

  // Auto conectar/desconectar por auth
  useEffect(() => {
    if (user && token) connect();
    else disconnect();
    return () => disconnect();
  }, [user, token, connect, disconnect]);

  // Limpa mensagens antigas
  useEffect(() => {
    if (messages.length > 100) {
      setMessages((prev) => prev.slice(-100));
    }
  }, [messages.length]);

  // Reconectar ao voltar visível/online
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && connectionStatus !== 'connected') {
        scheduleReconnect();
      }
    };
    const onOnline = () => {
      if (connectionStatus !== 'connected') scheduleReconnect();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [connectionStatus, scheduleReconnect]);

  const value = {
    isConnected,
    connectionStatus,
    messages,
    stats,
    connect,
    disconnect,
    on,
    off,
    sendToUser,
    broadcast,
    socket: {
      connected: isConnected,
      on,
      off,
      emit: (event, data) => {
        if (event === 'notification') return sendToUser(user?.id, 'notification', data);
        return broadcast(event, data);
      }
    }
  };

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
};