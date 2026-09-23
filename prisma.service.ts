// src/prisma/prisma.service.ts

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool, type PoolConfig } from 'pg';
import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  private static pool: Pool | null = null;

  private static isAttachedToVercel = false;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    PrismaService.validateDatabaseUrl(databaseUrl);

    PrismaService.logSafeDatabaseConfig(databaseUrl);

    if (!PrismaService.pool) {
      const poolConfig: PoolConfig = {
        connectionString: databaseUrl,

        ssl: PrismaService.createSslConfig(),

        /*
         * Mỗi Vercel function instance chỉ nên
         * tạo số lượng connection nhỏ.
         */
        max: PrismaService.getPoolMax(),

        min: 0,

        connectionTimeoutMillis: 15_000,

        idleTimeoutMillis: 10_000,

        /*
         * Cho phép Node.js kết thúc khi pool không
         * còn hoạt động.
         */
        allowExitOnIdle: true,

        keepAlive: true,

        keepAliveInitialDelayMillis: 10_000,
      };

      const pool = new Pool(poolConfig);

      pool.on('error', (error: Error) => {
        console.error('[PostgreSQL Pool] Unexpected idle client error:', error);
      });

      PrismaService.pool = pool;

      /*
       * Gọi ngay sau khi tạo pool.
       * Vercel Fluid Compute sẽ quản lý lifecycle
       * của các database connection.
       */
      if (process.env.VERCEL === '1') {
        attachDatabasePool(pool);

        PrismaService.isAttachedToVercel = true;
      }
    }

    const pool = PrismaService.pool;

    if (!pool) {
      throw new Error('PostgreSQL pool initialization failed');
    }

    const adapter = new PrismaPg(pool);

    super({
      adapter,

      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  /**
   * Kiểm tra DATABASE_URL nhưng không thực hiện
   * kết nối database.
   */
  private static validateDatabaseUrl(databaseUrl: string): void {
    if (databaseUrl.includes('\\')) {
      throw new Error('DATABASE_URL contains invalid backslash characters');
    }

    let parsed: URL;

    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error('DATABASE_URL has invalid URL format');
    }

    const supportedProtocols = ['postgres:', 'postgresql:'];

    if (!supportedProtocols.includes(parsed.protocol)) {
      throw new Error(`Unsupported database protocol: ${parsed.protocol}`);
    }

    if (!parsed.hostname) {
      throw new Error('DATABASE_URL hostname is missing');
    }

    if (!parsed.username) {
      throw new Error('DATABASE_URL username is missing');
    }

    if (!parsed.password) {
      throw new Error('DATABASE_URL password is missing');
    }
  }

  /**
   * Mặc định:
   *
   * - Vercel: 2 connections/function instance.
   * - Local/VPS: 10 connections.
   */
  private static getPoolMax(): number {
    const configured = Number(process.env.DATABASE_POOL_MAX);

    if (Number.isInteger(configured) && configured > 0) {
      return configured;
    }

    return process.env.VERCEL === '1' ? 2 : 10;
  }

  /**
   * PostgreSQL SSL configuration.
   *
   * DATABASE_SSL=false:
   *   Tắt SSL hoàn toàn, chỉ nên dùng local.
   *
   * DATABASE_SSL_REJECT_UNAUTHORIZED=true:
   *   Xác minh server certificate bằng CA file.
   *
   * Mặc định:
   *   Có mã hóa SSL nhưng không xác minh CA.
   */
  private static createSslConfig():
    | false
    | {
        rejectUnauthorized: boolean;
        ca?: string;
      } {
    if (process.env.DATABASE_SSL === 'false') {
      return false;
    }

    const rejectUnauthorized =
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';

    if (!rejectUnauthorized) {
      return {
        rejectUnauthorized: false,
      };
    }

    const certificatePath = resolve(
      process.cwd(),
      process.env.RDS_CA_PATH ?? 'global-bundle.pem',
    );

    if (!existsSync(certificatePath)) {
      throw new Error(`RDS CA certificate not found: ${certificatePath}`);
    }

    return {
      rejectUnauthorized: true,

      ca: readFileSync(certificatePath, 'utf8'),
    };
  }

  /**
   * Chỉ log thông tin không nhạy cảm.
   * Không log DATABASE_URL hoặc password.
   */
  private static logSafeDatabaseConfig(databaseUrl: string): void {
    const parsed = new URL(databaseUrl);

    console.log('[PostgreSQL configuration]', {
      protocol: parsed.protocol,

      host: parsed.hostname,

      port: parsed.port || '5432',

      database: parsed.pathname.replace(/^\//, '') || 'postgres',

      hasUsername: Boolean(parsed.username),

      hasPassword: Boolean(parsed.password),

      sslMode: parsed.searchParams.get('sslmode'),

      poolMax: PrismaService.getPoolMax(),

      vercel: process.env.VERCEL === '1',
    });
  }

  /**
   * Không gọi:
   *
   * - pool.query()
   * - this.$connect()
   * - this.$queryRaw()
   *
   * trong bootstrap.
   *
   * PrismaPg sẽ lấy connection từ pg Pool khi
   * endpoint thực hiện query đầu tiên.
   */
  onModuleInit(): void {
    this.logger.log('Prisma PostgreSQL adapter initialized');
  }

  async onModuleDestroy(): Promise<void> {
    try {
      /*
       * Giải phóng Prisma Client.
       */
      await this.$disconnect();

      /*
       * Khi chạy Vercel, attachDatabasePool()
       * quản lý lifecycle pool nên không gọi
       * pool.end().
       *
       * Local/VPS có thể tự đóng pool.
       */
      if (process.env.VERCEL !== '1' && PrismaService.pool) {
        await PrismaService.pool.end();

        PrismaService.pool = null;

        PrismaService.isAttachedToVercel = false;
      }

      this.logger.log(
        process.env.VERCEL === '1'
          ? 'Prisma disconnected; PostgreSQL pool retained for Vercel'
          : 'Prisma and PostgreSQL pool disconnected',
      );
    } catch (error: unknown) {
      this.logger.error(
        'Failed to disconnect database',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
