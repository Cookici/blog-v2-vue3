import { MessageVO, MessageType, MessageSend } from "@/types/message"
import { ElMessage } from "element-plus";
import mitt from 'mitt'
import { useUserStore } from '@/stores/user'

// 定义事件类型
export type WebSocketEvents = {
  message: MessageVO;
  connected: void;
  disconnected: void;
  error: Error;
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectDelay = 3000 // 3秒后重连
  private heartbeatInterval: number | null = null
  private autoReconnect = false // 添加自动重连标志
  
  // 创建事件发射器
  public events = mitt<WebSocketEvents>()

  setAutoReconnect(autoReconnect: boolean) {
    this.autoReconnect = autoReconnect
  }

  getAutoReconnect() {
    return this.autoReconnect
  }

  clearReconnectAttempts() {
    this.reconnectAttempts = 0
  }

  getReconnectAttempts() {
    return this.reconnectAttempts
  }

  getMaxReconnectAttempts() {
    return this.maxReconnectAttempts
  }

  // 连接WebSocket
  connect(autoReconnect = false) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket已经连接')
      return
    }

    this.autoReconnect = autoReconnect
    
    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('WebSocket连接失败: 未找到token')
      ElMessage.error('WebSocket连接失败: 请先登录')
      return
    }
    
    // 设置cookie，这样WebSocket连接时会自动带上
    document.cookie = `Authorization=${token}; path=/; SameSite=Strict`
    
    // 基础URL，不包含token
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:7001'}/api/netty`
    
    // 创建WebSocket对象
    const socket = new WebSocket(wsUrl)

    this.ws = socket

    this.ws.onopen = () => {
      console.log('WebSocket连接成功')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.events.emit('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MessageVO
        this.handleMessage(data)
      } catch (error) {
        console.error('消息解析失败:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket连接关闭')
      this.stopHeartbeat()
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
  }

  // 处理接收到的消息
  private handleMessage(message: MessageVO) {
    // 处理心跳消息
    if (message.messageType === MessageType.PING) {
      return
    }
    
    // 发射消息事件供其他组件订阅
    this.events.emit('message', message)
  }

  // 发送消息
  send(message: MessageSend) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket未连接')
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.stopHeartbeat()
      this.ws.close()
      this.ws = null
    }
  }

  // 尝试重新连接
  private attemptReconnect() {
    if (!this.autoReconnect) {
      console.log('自动重连已禁用')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      ElMessage.error('达到最大重连次数,请退出私信界面重新进入')
      return
    }

    this.reconnectAttempts++
    ElMessage.warning(`正在尝试重连...`)

    setTimeout(() => {
      const userId = localStorage.getItem('userId')
      if (userId) {
        this.connect(true)
      }
    }, this.reconnectDelay)
  }

  // 开始心跳
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      const userStore = useUserStore()
      const userId = userStore.userInfo?.userId || ''
      this.send({
        messageType: 'ping',
        messageContent: 'ping',
        toUserId: userId,
        userId: userId,
        timestamp: Date.now()
      })
    }, 30000) // 每30秒发送一次心跳
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// 导出单例
export const wsService = new WebSocketService()