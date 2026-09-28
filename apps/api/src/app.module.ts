import { Module } from '@nestjs/common';
import { ContentModule } from './content/content.module';
import { GoogleDocsModule } from './google-docs/google-docs.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, HealthModule, ContentModule, GoogleDocsModule],
})
export class AppModule {}
