import { create } from 'zustand';

interface WebSocketState {
    isConnected: boolean;
    setIsConnected: (connected: boolean) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
    isConnected: false,
    setIsConnected: (connected) => set({ isConnected: connected }),
}));
