import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import {
  RealtimeEvent,
  RealtimeEvents,
} from '@/realtime/realtime.events';

type SocketUser = { userId: string; email: string };

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = this.authenticate(client);
      client.data.user = user;
      await client.join(this.room(user.userId));
      client.emit('connected', { userId: user.userId });
      this.logger.debug(`WS bağlandı ${user.userId}`);
    } catch {
      client.emit('error', { message: 'Yetkisiz' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (user) this.logger.debug(`WS koptu ${user.userId}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() _body: unknown) {
    return { event: 'pong', data: { at: Date.now(), userId: client.data.user?.userId } };
  }

  emitToUser(userId: string, event: RealtimeEvent, payload: unknown) {
    this.server.to(this.room(userId)).emit(event, payload);
  }

  notifyDashboard(userId: string) {
    this.emitToUser(userId, RealtimeEvents.DASHBOARD_UPDATED, {
      at: new Date().toISOString(),
    });
  }

  private room(userId: string) {
    return `user:${userId}`;
  }

  private authenticate(client: Socket): SocketUser {
    const raw =
      (client.handshake.auth?.token as string | undefined) ||
      (client.handshake.query?.token as string | undefined) ||
      (typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization
        : undefined);

    if (!raw) throw new Error('token missing');
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
    const payload = this.jwt.verify<{ sub: string; email: string }>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    if (!payload?.sub) throw new Error('invalid token');
    return { userId: payload.sub, email: payload.email };
  }
}
