import { Injectable } from '@nestjs/common';
import { ServerResponse } from 'http';
@Injectable()
export class SseService {
  private clients = new Map<string, ServerResponse>();

  // 添加客户端
  addClient(clientId: string, res: ServerResponse) {
    this.clients.set(clientId, res);
  }

  // 移除客户端
  removeClient(clientId: string) {
    this.clients.delete(clientId);
  }

  // 广播消息
  broadcastMessage(message: string) {
    this.clients.forEach((res) => {
      res.write(`data: ${JSON.stringify({ message })}\n\n`);
    });
  }

  // 给指定客户端发送消息
  sendMessageToClient(clientId: string, message: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(`data: ${JSON.stringify({ message })}\n\n`);
    } else {
      console.warn(`客户端 ${clientId} 不存在或已断开连接`);
    }
  }
}
