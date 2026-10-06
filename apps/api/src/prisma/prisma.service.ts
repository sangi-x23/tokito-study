import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    // El runtime usa la conexión pooled. El adaptador habla por WebSocket, así
    // que soporta transacciones interactivas: la ingesta las necesita para
    // hacer los upserts de una corrida de forma atómica. La variante HTTP
    // (`PrismaNeonHttp`) es más ligera pero no las soporta.
    super({ adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }) });
  }

  // A propósito no hay `$connect()` en onModuleInit: Prisma conecta solo en la
  // primera consulta. Conectar al arrancar despertaría la base en cada arranque
  // en frío de la función, incluso para peticiones que no la tocan (`/health`),
  // y el free tier de Neon cobra por horas de cómputo.

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
