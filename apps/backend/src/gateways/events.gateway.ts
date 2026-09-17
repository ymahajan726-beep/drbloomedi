import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'], credentials: true }, transports: ['websocket', 'polling'] })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  afterInit(server: Server) { console.log('⚡ [Socket.IO] EventsGateway Initialized successfully on port 4000'); }
  handleConnection(client: Socket) { console.log(`⚡ [Socket.IO] Frontend Client Connected! ID: ${client.id}`); }
  handleDisconnect(client: Socket) { console.log(`⚡ [Socket.IO] Client Disconnected: ${client.id}`); }

  emitNewAppointment(appointment: any) {
    console.log('⚡ [Socket.IO] Broadcasting appointment:new to all connected screens:', appointment?.appointmentNumber);
    if (this.server) { this.server.emit('appointment:new', appointment); }
    else { console.warn('⚠️ [Socket.IO] Server instance not ready yet!'); }
  }

  emitTokenCalled(data: { tokenNumber: string; doctorName: string; roomNumber?: string }) {
    if (this.server) { this.server.emit('queue:call-token', data); }
  }

  @SubscribeMessage('ping')
  handlePing(): string { return 'pong'; }
}