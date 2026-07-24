import { Module } from '@nestjs/common';
import { RootController } from './modules/root/root.controller';
import { HtmlFileService } from './modules/root/html-file.service';
import { CardsModule } from './modules/cards/cards.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [CardsModule, TokensModule, MetricsModule],
  controllers: [RootController],
  providers: [HtmlFileService],
})
export class AppModule {}
