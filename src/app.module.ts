import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileModule } from './modules/file/file.module';
import { SseModule } from './modules/sse/sse.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [FileModule, SseModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
