import { createId } from '@paralleldrive/cuid2';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  AuthProvider,
  DrinkType,
  ProfanityLevel,
  PunishmentIntensity,
  RoutineKind,
  ThreatStatus,
} from './enums';

@Entity('User')
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'text' })
  displayName!: string;

  @Column({ type: 'enum', enum: AuthProvider, enumName: 'AuthProvider' })
  provider!: AuthProvider;

  @Column({ type: 'text' })
  providerId!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'int', default: 2500 })
  dailyGoalMl!: number;

  @Column({ type: 'int', default: 0 })
  streakDays!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastGoalDate!: Date | null;

  /** Expo push token (ExponentPushToken[...]) */
  @Column({ type: 'text', nullable: true })
  expoPushToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastAppOpenedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastComebackAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (t) => t.user)
  refreshTokens!: RefreshToken[];

  @OneToOne(() => UserSettings, (s) => s.user)
  settings!: UserSettings | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('RefreshToken')
export class RefreshToken {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text', unique: true })
  token!: string;

  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => User, (u) => u.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('Character')
export class Character {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  badge!: string | null;

  @Column({ type: 'int', default: 96 })
  maxDb!: number;

  @Column({ type: 'text', default: 'Ölümcül' })
  dosageLabel!: string;

  @Column({ type: 'int', default: 42 })
  recordingCount!: number;

  @Column({ type: 'int', default: 0 })
  unlockStreakDays!: number;

  @Column({ type: 'boolean', default: true })
  isSystem!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('UserSettings')
export class UserSettings {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text', unique: true })
  userId!: string;

  @OneToOne(() => User, (u) => u.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'boolean', default: true })
  voiceNotifications!: boolean;

  @Column({ type: 'boolean', default: true })
  plus18Mode!: boolean;

  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  @Column({
    type: 'enum',
    enum: ProfanityLevel,
    enumName: 'ProfanityLevel',
    default: ProfanityLevel.UNFILTERED,
  })
  profanityLevel!: ProfanityLevel;

  @Column({ type: 'text', nullable: true })
  activeCharacterId!: string | null;

  @ManyToOne(() => Character, { nullable: true })
  @JoinColumn({ name: 'activeCharacterId' })
  activeCharacter!: Character | null;

  @Column({ type: 'boolean', default: true })
  officeMute!: boolean;

  @Column({ type: 'boolean', default: true })
  nightMode!: boolean;

  @Column({ type: 'int', default: 23 })
  nightStartHour!: number;

  @Column({ type: 'int', default: 8 })
  nightEndHour!: number;

  @Column({ type: 'boolean', default: true })
  remindWater!: boolean;

  @Column({ type: 'boolean', default: true })
  remindCaffeine!: boolean;

  @Column({ type: 'boolean', default: true })
  remindMedicine!: boolean;

  @Column({ type: 'boolean', default: false })
  remindElectrolyte!: boolean;

  @Column({ type: 'boolean', default: true })
  remindWalk!: boolean;

  @Column({ type: 'int', default: 45 })
  waterIntervalMinutes!: number;

  /** Kullanıcı kapatana kadar su hatırlatması sürer. */
  @Column({ type: 'boolean', default: false })
  remindersEnabled!: boolean;

  /** Su içilmeden art arda giden 5 dk takip sayısı. */
  @Column({ type: 'int', default: 0 })
  nagCount!: number;

  @Column({ type: 'text', default: 'tr' })
  locale!: string;

  @Column({ type: 'boolean', default: true })
  publicShameProtection!: boolean;

  @Column({ type: 'int', default: 45 })
  whisperVolume!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('ThreatTemplate')
export class ThreatTemplate {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({
    type: 'enum',
    enum: ProfanityLevel,
    enumName: 'ProfanityLevel',
    default: ProfanityLevel.NEIGHBORHOOD,
  })
  profanityLevel!: ProfanityLevel;

  @Column({ type: 'text', nullable: true })
  characterId!: string | null;

  @ManyToOne(() => Character, { nullable: true })
  @JoinColumn({ name: 'characterId' })
  character!: Character | null;

  @Column({ type: 'text', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  playCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('Intake')
@Index(['userId', 'createdAt'])
export class Intake {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: DrinkType, enumName: 'DrinkType' })
  type!: DrinkType;

  @Column({ type: 'text' })
  label!: string;

  @Column({ type: 'int' })
  amountMl!: number;

  @Column({ type: 'int', default: 0 })
  penaltyMl!: number;

  @Column({ type: 'int' })
  netMl!: number;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('ThreatEvent')
@Index(['userId', 'scheduledAt'])
export class ThreatEvent {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'text', nullable: true })
  templateId!: string | null;

  @ManyToOne(() => ThreatTemplate, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template!: ThreatTemplate | null;

  @Column({ type: 'text', nullable: true })
  characterId!: string | null;

  @ManyToOne(() => Character, { nullable: true })
  @JoinColumn({ name: 'characterId' })
  character!: Character | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: ThreatStatus,
    enumName: 'ThreatStatus',
    default: ThreatStatus.PENDING,
  })
  status!: ThreatStatus;

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  playedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('Routine')
export class Routine {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: DrinkType,
    enumName: 'DrinkType',
    default: DrinkType.WATER,
  })
  drinkType!: DrinkType;

  @Column({ type: 'int', default: 350 })
  amountMl!: number;

  @Column({
    type: 'enum',
    enum: RoutineKind,
    enumName: 'RoutineKind',
    default: RoutineKind.SPECIFIC_TIMES,
  })
  kind!: RoutineKind;

  @Column({ type: 'int', nullable: true })
  intervalMinutes!: number | null;

  @Column({ type: 'text', array: true, default: [] })
  specificTimes!: string[];

  @Column({
    type: 'enum',
    enum: PunishmentIntensity,
    enumName: 'PunishmentIntensity',
    default: PunishmentIntensity.HARD,
  })
  intensity!: PunishmentIntensity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RoutineLog, (l) => l.routine)
  logs!: RoutineLog[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('RoutineLog')
@Index(['userId', 'plannedAt'])
export class RoutineLog {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'text' })
  routineId!: string;

  @ManyToOne(() => Routine, (r) => r.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routineId' })
  routine!: Routine;

  @Column({ type: 'text' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamptz' })
  plannedAt!: Date;

  @Column({
    type: 'enum',
    enum: ThreatStatus,
    enumName: 'ThreatStatus',
    default: ThreatStatus.PENDING,
  })
  status!: ThreatStatus;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}

@Entity('LandingPage')
export class LandingPage {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

export const entities = [
  User,
  RefreshToken,
  Character,
  UserSettings,
  ThreatTemplate,
  Intake,
  ThreatEvent,
  Routine,
  RoutineLog,
  LandingPage,
];
