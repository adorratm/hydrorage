import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from '@/database/entities';

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound?: 'default' | null;
  data?: Record<string, unknown>;
};

@Injectable()
export class PushService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ) {
    const user = await this.em.findOneBy(User, { id: userId });
    const token = user?.expoPushToken?.trim();
    if (!token || !token.startsWith('ExponentPushToken')) return { sent: false };

    const message: ExpoMessage = {
      to: token,
      title: payload.title,
      body: payload.body,
      sound: 'default',
      data: payload.data,
    };

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (!res.ok) return { sent: false, status: res.status };
      return { sent: true };
    } catch {
      return { sent: false };
    }
  }
}
