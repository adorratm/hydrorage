import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import {
  RealtimeEvent,
  RealtimeEvents,
} from '@/realtime/realtime.events';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emit(userId: string, event: RealtimeEvent, payload: unknown) {
    this.gateway.emitToUser(userId, event, payload);
  }

  intakeCreated(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.INTAKE_CREATED, payload);
    this.gateway.notifyDashboard(userId);
  }

  threatScheduled(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.THREAT_SCHEDULED, payload);
    this.gateway.notifyDashboard(userId);
  }

  threatDue(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.THREAT_DUE, payload);
    this.gateway.notifyDashboard(userId);
  }

  threatPlayed(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.THREAT_PLAYED, payload);
    this.gateway.notifyDashboard(userId);
  }

  threatCompleted(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.THREAT_COMPLETED, payload);
    this.gateway.notifyDashboard(userId);
  }

  routineMissed(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.ROUTINE_MISSED, payload);
    this.gateway.notifyDashboard(userId);
  }

  routineCompleted(userId: string, payload: unknown) {
    this.emit(userId, RealtimeEvents.ROUTINE_COMPLETED, payload);
    this.gateway.notifyDashboard(userId);
  }
}
