import SockJS from 'sockjs-client';
import { authService } from './authService';
import { useWebSocketStore } from '@/store/useWebSocketStore';

type MessageHandler = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: Set<MessageHandler> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isManuallyClosed: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5; // Giới hạn tối đa 5 lần retry
    private baseReconnectDelay: number = 5000; // 5 giây ban đầu

    connect() {
        if (this.socket?.readyState === SockJS.OPEN) return;

        this.isManuallyClosed = false;
        const token = authService.getToken();
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://furnimart.click/api";

        // Construct the WebSocket URL. 
        // If API_BASE_URL is https://furnimart.click/api, 
        // we might need to adjust it to point to the WebSocket endpoint.
        // The user said: ws://localhost:8086/ws/chat or http://localhost:8086/ws/chat (SockJS)

        // In production, we need to keep the /api prefix so the proxy can route
        // /api/ws/chat to the backend correctly.
        let wsBase = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if any

        // If it still doesn't work, we might need to manually ensure it's /api/ws/chat
        if (!wsBase.endsWith('/api')) {
            wsBase = wsBase.includes('/api') ? wsBase : `${wsBase}/api`;
        }

        const url = `${wsBase}/ws/chat${token ? `?token=${token}` : ''}`;

        console.log('[WS] Connecting to:', url);

        this.socket = new SockJS(url) as unknown as WebSocket;

        this.socket.onopen = () => {
            console.log('[WS] Connected');
            useWebSocketStore.getState().setIsConnected(true);
            this.reconnectAttempts = 0; // Reset counter khi kết nối thành công
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
        
        // Kiểm tra số lần retry
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`[WS] Max reconnect attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`);
            console.log('[WS] Please refresh the page to try connecting again.');
            return;
        }

        // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;

        console.log(`[WS] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay / 1000}s...`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    subscribe(handler: MessageHandler) {
        this.listeners.add(handler);
        return () => {
            this.listeners.delete(handler);
        };
    }

    disconnect() {
        this.isManuallyClosed = true;
        this.reconnectAttempts = 0; // Reset counter khi disconnect thủ công
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

    // Method để reset retry counter thủ công nếu cần
    resetReconnectAttempts() {
        this.reconnectAttempts = 0;
        console.log('[WS] Reconnect attempts counter has been reset');
    }

}

export const webSocketService = new WebSocketService();
