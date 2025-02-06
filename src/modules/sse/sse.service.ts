import { Injectable } from '@nestjs/common';
import { ServerResponse } from 'http';
import Redis from 'ioredis';
import { Interval } from '@nestjs/schedule';
@Injectable()
export class SseService {
  private redisPublisher = new Redis(); // 用于发送消息
  private redisSubscriber = new Redis(); // 用于接收消息
  private clients: Map<string, ServerResponse> = new Map(); // 存储本地连接

  constructor() {
    // 订阅 Redis 频道，接收所有实例推送的消息
    this.redisSubscriber.subscribe('sse-channel');
    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'sse-channel') {
        const { message: msg, clientId } = JSON.parse(message);
        this.sendToLocalClients(msg, clientId);
      }
    });
  }

  // 添加客户端
  addClient(clientId: string, res: ServerResponse) {
    this.clients.set(clientId, res);
  }

  // 移除客户端
  removeClient(clientId: string) {
    this.clients.delete(clientId);
  }

  /**
   * 推送消息到当前实例的所有客户端或指定客户端
   * @param message 消息内容
   * @param clientId 可选，指定客户端 ID，若为空则广播给所有客户端
   */
  private sendToLocalClients(message: string, clientId?: string) {
    if (clientId) {
      const client = this.clients.get(clientId);
      if (client) {
        client.write(`data: ${JSON.stringify({ message })}\n\n`);
      }
    } else {
      this.clients.forEach((res) => {
        res.write(`data: ${JSON.stringify({ message })}\n\n`);
      });
    }
  }

  /**
   * 推送消息到所有实例的所有客户端或指定客户端
   * @param message 消息内容
   * @param clientId 可选，指定客户端 ID，若为空则广播给所有客户端
   */
  sendToAllInstances(message: string, clientId?: string) {
    this.redisPublisher.publish(
      'sse-channel',
      JSON.stringify({ message, clientId }),
    );
  }

  // 定时任务：每隔 2 分钟发送心跳消息，保持连接活跃
  @Interval(120000)
  sendHeartbeat() {
    const heartbeatMsg = 'keep-alive';
    // 这里使用全局广播方式
    this.sendToAllInstances(heartbeatMsg);
    console.log('心跳消息已发送:', heartbeatMsg);
  }
}
