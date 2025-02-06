import { Controller, Get, Req, Res, Sse } from '@nestjs/common';
import { Response, Request } from 'express';
import { SseService } from './sse.service';
import { v4 as uuidv4 } from 'uuid';
import { Interval } from '@nestjs/schedule';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('msg')
  createMsgEvent(@Res() res: Response, @Req() req: Request) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // 立即发送头部

    const clientId = uuidv4(); // 分配唯一 ID
    this.sseService.addClient(clientId, res);

    // 可选：发送一个欢迎消息
    res.write(`data: ${JSON.stringify({ message: 'SSE 连接已建立' })}\n\n`);
  }

  // 测试用 定时发送消息
  @Interval(5000)
  sendMessage() {
    const testMsg = '测试消息发送';
    console.log('testMsg');
    this.sseService.broadcastMessage(testMsg);
    return { success: true, message: testMsg };
  }
}
