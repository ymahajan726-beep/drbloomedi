'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected to DrBlooMedi gateway:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}