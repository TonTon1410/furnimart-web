import SockJS from 'sockjs-client';
import { authService } from './authService';
import { useWebSocketStore } from '@/store/useWebSocketStore';

type MessageHandler = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: Set<MessageHandler> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isManuallyClosed: boolean = false;

    connect() {
        if (this.socket?.readyState === SockJS.OPEN) return;

        this.isManuallyClosed = false;
        const token = authService.getToken();
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";

        // Construct the WebSocket URL. 
        // If API_BASE_URL is https://furnimart.click/api, 
        // we might need to adjust it to point to the WebSocket endpoint.
        // The user said: ws://localhost:8086/ws/chat or http://localhost:8086/ws/chat (SockJS)

        // We'll try to derive the base from VITE_API_BASE_URL but replace /api with /ws/chat
        // or use a dedicated env var if available.
        let wsBase = API_BASE_URL.replace(/\/api$/, '');
        if (import.meta.env.VITE_API_EMPLOYEE) {
            wsBase = import.meta.env.VITE_API_EMPLOYEE.replace(/\/api$/, '');
        }

        const url = `${wsBase}/ws/chat${token ? `?token=${token}` : ''}`;

        console.log('[WS] Connecting to:', url);

        this.socket = new SockJS(url) as unknown as WebSocket;

        this.socket.onopen = () => {
            console.log('[WS] Connected');
            useWebSocketStore.getState().setIsConnected(true);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[WS] Received:', data);
                this.listeners.forEach(listener => listener(data));
            } catch (e) {
                console.warn('[WS] Failed to parse message:', event.data);
            }
        };

        this.socket.onclose = (event) => {
            console.log('[WS] Disconnected:', event.reason);
            useWebSocketStore.getState().setIsConnected(false);
            this.socket = null;
            if (!this.isManuallyClosed) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('[WS] Error:', error);
            useWebSocketStore.getState().setIsConnected(false);
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) return;
        console.log('[WS] Scheduling reconnect in 5s...');
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, 5000);
    }

    subscribe(handler: MessageHandler) {
        this.listeners.add(handler);
        return () => {
            this.listeners.delete(handler);
        };
    }

    disconnect() {
        this.isManuallyClosed = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            useWebSocketStore.getState().setIsConnected(false);
        }
    }

    sendMessage(message: any) {
        if (this.socket?.readyState === SockJS.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('[WS] Cannot send message, socket not connected');
        }
    }
}

export const webSocketService = new WebSocketService();
