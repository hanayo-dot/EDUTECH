import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error:', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Disconnected from Redis.');
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async revokeSession(sessionId: string, ttlSeconds = 604800): Promise<void> {
    // 7 days default revocation TTL in Redis
    await this.client.set(`revoked_session:${sessionId}`, '1', 'EX', ttlSeconds);
  }

  async isSessionRevoked(sessionId: string): Promise<boolean> {
    const res = await this.client.get(`revoked_session:${sessionId}`);
    return res === '1';
  }

  async acquireLock(key: string, ttlSeconds = 10): Promise<boolean> {
    const res = await this.client.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(`lock:${key}`);
  }
}
