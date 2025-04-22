<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="chat-container">
      <!-- 左侧联系人列表 -->
      <el-aside width="280px" class="contact-list">
        <div class="contact-header">
          <div class="header-content">
            <div class="header-top">
              <h3>好友列表 ({{ contactTotal }})</h3>
              <div class="header-badges">
                <el-badge :value="friendApplyCount" :hidden="friendApplyCount === 0" class="apply-badge">
                  <el-button :icon="Bell" class="action-btn" @click="showFriendApplyDialog = true">
                    好友申请
                  </el-button>
                </el-badge>
              </div>
            </div>
            <div class="header-actions">
              <el-button type="primary" :icon="Plus" class="action-btn" @click="showFriendDialog = true">
                添加好友
              </el-button>
              <el-button :type="isManageMode ? 'success' : 'default'" :icon="Setting" class="action-btn"
                @click="isManageMode = !isManageMode">
                {{ isManageMode ? '完成管理' : '好友管理' }}
              </el-button>
            </div>
          </div>
        </div>
        <div class="contact-search">
          <el-input v-model="searchQuery" placeholder="搜索好友" prefix-icon="Search" clearable />
        </div>
        <div class="contact-items">
          <div v-for="contact in filteredContacts" :key="contact.userInfo.userId" class="contact-item" :class="{
            active: currentChat?.userInfo.userId === contact.userInfo.userId && !isManageMode,
            'manage-mode': isManageMode
          }">
            <div class="contact-main" @click="!isManageMode && selectChat(contact)">
              <el-avatar :size="40" :src="contact.userInfo.userPhoto" />
              <div class="contact-info">
                <div class="contact-name">
                  {{ contact.friendName?.trim() ? contact.friendName : contact.userInfo.userName }}
                  <el-tag v-if="contact.friendName?.trim()" size="small" type="info">
                    {{ contact.userInfo.userName }}
                  </el-tag>
                </div>
                <div class="last-message" v-if="!isManageMode">
                  {{ contact.lastMessage || '暂无消息' }}
                </div>
              </div>
            </div>

            <!-- 管理模式下的操作按钮 -->
            <div v-if="isManageMode" class="manage-actions">
              <el-button link type="primary" size="small" @click="editFriendName(contact)">
                修改备注
              </el-button>
              <el-button link type="danger" size="small" @click="deleteFriend(contact.userInfo.userId)">
                删除
              </el-button>
            </div>

            <!-- 非管理模式下显示最后消息时间和未读数 -->
            <div v-else class="contact-meta">
              <span class="message-time">{{ formatTime(Number(contact.lastMessageTime) || 0) }}</span>
              <el-badge v-if="contact.unreadCount" :value="contact.unreadCount" class="unread-badge" />
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="contacts.length < contactTotal" class="load-more" :class="{ 'is-loading': loadingContacts }"
            @click="handleContactPageChange(contactPage + 1)">
            <span v-if="!loadingContacts">加载更多</span>
            <el-icon v-else class="is-loading">
              <Loading />
            </el-icon>
          </div>
        </div>
      </el-aside>

      <!-- 好友搜索对话框 -->
      <el-dialog v-model="showFriendDialog" title="添加好友" width="500px">
        <div class="friend-search">
          <el-input v-model="friendSearchKey" placeholder="搜索用户名/手机号" @keyup.enter="searchFriends">
            <template #append>
              <el-button @click="searchFriends">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div class="friend-list">
          <div v-for="user in searchResults" :key="user.userId" class="friend-item">
            <el-avatar :size="40" :src="user.userPhoto" />
            <div class="friend-info">
              <div class="friend-name">{{ user.userName }}</div>
              <div class="friend-phone">{{ user.userPhone }}</div>
            </div>
            <el-button type="primary" size="small" :icon="Plus" class="add-friend-btn" @click="addFriend(user.userId)">
              加为好友
            </el-button>
          </div>

          <el-pagination v-if="searchTotal > 0" :current-page="searchPage" :page-size="searchPageSize"
            :total="searchTotal" @current-change="handleSearchPageChange" layout="prev, pager, next" background />
        </div>
      </el-dialog>

      <!-- 好友管理对话框 -->
      <el-dialog v-model="showFriendManageDialog" title="好友管理" width="500px">
        <div class="friend-list">
          <div v-for="friend in friendList" :key="friend.userInfo.userId" class="friend-item">
            <el-avatar :size="40" :src="friend.userInfo.userPhoto" />
            <div class="friend-info">
              <div class="friend-name">
                {{ friend.friendName || friend.userInfo.userName }}
                <el-button link type="primary" @click="editFriendName(friend)">
                  修改备注
                </el-button>
              </div>
              <div class="friend-phone">{{ friend.userInfo.userPhone }}</div>
            </div>
            <el-button type="danger" size="small" @click="deleteFriend(friend.userInfo.userId)">
              删除
            </el-button>
          </div>

          <el-pagination v-if="friendTotal > 0" :current-page="friendPage" :page-size="friendPageSize"
            :total="friendTotal" @current-change="handleFriendPageChange" layout="prev, pager, next" background />
        </div>
      </el-dialog>

      <!-- 添加好友申请对话框 -->
      <el-dialog v-model="showFriendApplyDialog" title="好友申请" width="500px">
        <div class="friend-apply-list">
          <div v-for="apply in friendApplyList" :key="apply.userInfo.userId" class="friend-apply-item">
            <el-avatar :size="40" :src="apply.userInfo.userPhoto" />
            <div class="friend-info">
              <div class="friend-name">{{ apply.userInfo.userName }}</div>
              <div class="friend-phone">{{ apply.userInfo.userPhone }}</div>
              <div class="apply-description">
                申请描述：{{ apply.description || '无' }}
              </div>
            </div>
            <div class="apply-actions">
              <el-button type="primary" size="small" @click="handleAccept(apply)">
                同意
              </el-button>
              <el-button type="danger" size="small" @click="handleReject(apply)">
                拒绝
              </el-button>
            </div>
          </div>

          <el-pagination v-if="friendApplyTotal > 0" :current-page="friendApplyPage" :page-size="friendApplyPageSize"
            :total="friendApplyTotal" @current-change="handleFriendApplyPageChange" layout="prev, pager, next"
            background />
        </div>
      </el-dialog>

      <!-- 右侧聊天区域 -->
      <el-main class="chat-main">
        <template v-if="currentChat">
          <div class="chat-header">
            <h3>{{ currentChat.friendName?.trim() ? currentChat.friendName : currentChat.userInfo.userName }}</h3>
          </div>

          <div class="message-container" ref="messageContainer" @scroll="handleScroll">
            <!-- 加载更多提示 -->
            <div v-if="loading" class="loading-more">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              加载更多...
            </div>

            <div v-for="msg in currentMessages" :key="msg.messageId" :id="'msg-' + msg.messageId" class="message-item"
              :class="{
                'message-self': msg.userId === userInfo?.userId,
                'message-unread': msg.messageStatus === 'offline'
              }">
              <el-avatar :size="36"
                :src="msg.userId === userInfo?.userId ? userInfo?.userPhoto : currentChat?.userInfo.userPhoto" />
              <div class="message-content">
                <div class="message-bubble">
                  <!-- 根据消息类型显示不同内容 -->
                  <template v-if="msg.messageType === MessageType.TEXT">
                    {{ msg.messageContent }}
                  </template>
                  <template v-else-if="msg.messageType === MessageType.PHOTO">
                    <el-image 
                      :src="msg.messageContent"
                      class="message-image"
                      :preview-src-list="[msg.messageContent]"
                      style="width: 100px; height: 100px; object-fit: cover;"
                    />
                  </template>
                </div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <div class="input-toolbar">
              <el-upload v-if="!imageToSend" class="image-uploader" :action="uploadAction"
                :before-upload="beforeImageUpload" :http-request="handleImageUpload" :show-file-list="false"
                accept="image/*">
                <el-button :icon="Picture">
                  添加图片
                </el-button>
              </el-upload>
            </div>

            <!-- 添加图片预览区域 -->
            <div v-if="imageToSend" class="image-preview">
              <el-image :src="imageToSend" class="preview-image" />
              <el-button class="remove-image" circle @click="removeImage">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>

            <el-input v-model="messageInput" type="textarea" :rows="3" placeholder="输入消息..."
              @keyup.enter.exact="sendMessage" />

            <div class="input-actions">
              <el-button type="primary" @click="sendMessage" :disabled="!messageInput.trim() && !imageToSend">
                发送
              </el-button>
            </div>
          </div>
        </template>

        <div v-else class="no-chat">
          <el-empty description="选择一个联系人开始聊天" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import { Picture, Loading, Plus, Setting, Bell, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wsService } from '@/services/modules/websocket'
import dayjs from 'dayjs'
import { useUploadApi } from '@/services/modules/upload'
import { useMessageApi } from '@/services/modules/message'
import { useFriendApi } from '@/services/modules/friend'
import { useUserApi } from '@/services/modules/user'
import { MessageVO, MessageSend, MessageType } from '@/types/message'
import type { FriendApplyPageReq, FriendApplyResp, FriendResp } from '@/types/friend'
import { UserInfo } from '@/types/user'

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

interface Contact extends FriendResp {
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

// 聊天相关的状态
const contacts = ref<Contact[]>([])
const searchQuery = ref('')
const currentChat = ref<Contact | null>(null)
const messageInput = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const currentMessages = ref<MessageVO[]>([])
const imageToSend = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const hasMore = ref(true)

// 好友搜索相关
const showFriendDialog = ref(false)
const friendSearchKey = ref('')
const searchResults = ref<UserInfo[]>([])
const searchPage = ref(1)
const searchPageSize = ref(10)
const searchTotal = ref(0)

// 好友管理相关
const showFriendManageDialog = ref(false)
const friendList = ref<FriendResp[]>([])
const friendPage = ref(1)
const friendPageSize = ref(10)
const friendTotal = ref(0)

// 联系人分页相关状态
const contactPage = ref(1)
const contactPageSize = ref(20)
const contactTotal = ref(0)
const loadingContacts = ref(false)

// 好友申请相关
const showFriendApplyDialog = ref(false)
const friendApplyList = ref<FriendApplyResp[]>([])
const friendApplyPage = ref(1)
const friendApplyPageSize = ref(10)
const friendApplyTotal = ref(0)
const friendApplyCount = ref(0)

// 在 script setup 中添加
const isManageMode = ref(false) // 是否处于好友管理模式

// 过滤联系人
const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value

  const query = searchQuery.value.toLowerCase()
  return contacts.value.filter(contact => {
    const displayName = contact.friendName || contact.userInfo.userName
    return displayName.toLowerCase().includes(query)
  })
})

// 选择聊天对象
const selectChat = async (contact: Contact) => {
  currentChat.value = contact
  currentPage.value = 1
  currentMessages.value = []
  hasMore.value = true

  // 清除未读数
  if (contact.unreadCount) {
    const contactIndex = contacts.value.findIndex(c => c.userInfo.userId === contact.userInfo.userId)
    if (contactIndex !== -1) {
      contacts.value[contactIndex].unreadCount = 0
    }
  }

  await loadHistoryMessages(contact.userInfo.userId)
  await nextTick()
  scrollToBottom()
}

// 图片上传相关
const uploadAction = ref('/api/oss/file/upload')

// 移除图片
const removeImage = () => {
  imageToSend.value = ''
}

// 图片上传前的验证
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理图片上传
const handleImageUpload = async (options: any) => {
  try {
    const formData = new FormData()
    formData.append('imageFile', options.file)
    const { fileUrl } = await useUploadApi.uploadImage(formData)
    imageToSend.value = fileUrl
    ElMessage.success('图片上传成功')
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传失败')
  }
}

// 修改发送消息方法
const sendMessage = async () => {
  if (!currentChat.value || !userInfo.value) return

  // 创建一个新的消息数组，用于按顺序发送
  const messagesToSend = []
  
  // 如果有文本消息，先添加文本消息
  if (messageInput.value.trim()) {
    const textMessage: MessageSend = {
      messageType: MessageType.TEXT,
      messageContent: messageInput.value,
      toUserId: currentChat.value.userInfo.userId,
      userId: userInfo.value.userId,
      timestamp: Date.now()
    }
    messagesToSend.push(textMessage)
  }

  // 如果有图片消息，再添加图片消息
  if (imageToSend.value) {
    const imageMessage: MessageSend = {
      messageType: MessageType.PHOTO,
      messageContent: imageToSend.value,
      toUserId: currentChat.value.userInfo.userId,
      userId: userInfo.value.userId,
      timestamp: Date.now() + 1 // 确保图片消息的时间戳晚于文本消息
    }
    messagesToSend.push(imageMessage)
  }

  // 按顺序发送消息
  for (const message of messagesToSend) {
    wsService.send(message)
    currentMessages.value.push({
      ...message,
      messageId: `temp_${message.timestamp}`,
      messageStatus: 'online'
    })
  }

  // 更新联系人最后一条消息
  if (messagesToSend.length > 0) {
    const lastMessage = {
      ...messagesToSend[messagesToSend.length - 1],
      messageId: `temp_${Date.now()}`,
      messageStatus: 'online'
    } as MessageVO
    updateContactLastMessage(lastMessage)
  }

  // 清空输入
  messageInput.value = ''
  imageToSend.value = ''

  await nextTick()
  scrollToBottom()
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 加载历史消息
const loadHistoryMessages = async (userId: string, isLoadMore = false) => {
  if (loading.value || (!isLoadMore && !hasMore.value)) return

  try {
    loading.value = true
    const params = {
      userId: userInfo.value?.userId || '',
      toUserId: userId,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    const pageInfo = await useMessageApi.page(params)
    if (!pageInfo || !pageInfo.data) {
      currentMessages.value = []
      hasMore.value = false
      return
    }

    // 检查未读消息
    const offlineMessages = pageInfo.data.filter((msg: MessageVO) =>
      msg.messageStatus === 'offline' && // 消息未读
      msg.toUserId === userInfo.value?.userId // 接收者是当前用户
    )

    if (offlineMessages.length > 0) {
      const messageReqDTOList = offlineMessages.map(msg => ({
        userId: msg.userId,
        toUserId: msg.toUserId,
        messageId: msg.messageId,
        timestamp: msg.timestamp
      }))

      await useMessageApi.changeStatus({ messageReqDTOList })

      // 更新本地消息状态
      pageInfo.data.forEach(msg => {
        if (offlineMessages.some(offline => offline.messageId === msg.messageId)) {
          msg.messageStatus = 'online'
        }
      })
    }

    // 由于后端是降序返回，我们需要反转顺序以保证旧消息在上，新消息在下
    const sortedMessages = [...pageInfo.data].reverse()

    if (isLoadMore) {
      // 加载更多时，旧消息添加到前面
      currentMessages.value = [...sortedMessages, ...currentMessages.value]
    } else {
      // 初始加载时直接赋值
      currentMessages.value = sortedMessages
    }

    hasMore.value = pageInfo.total ? currentMessages.value.length < pageInfo.total : false
    if (hasMore.value) {
      currentPage.value++
    }

    if (!isLoadMore) {
      await nextTick()
      scrollToBottom()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史消息失败')
    currentMessages.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

// 获取可见消息
const getVisibleMessages = (container: HTMLElement): MessageVO[] => {
  if (!container || !currentMessages.value) return []

  try {
    const containerRect = container.getBoundingClientRect()

    return currentMessages.value.filter(msg => {
      const msgElement = document.getElementById(`msg-${msg.messageId}`)
      if (!msgElement) return false

      const msgRect = msgElement.getBoundingClientRect()
      return msgRect.top >= containerRect.top && msgRect.bottom <= containerRect.bottom
    })
  } catch (error) {
    console.error('获取可见消息失败:', error)
    return []
  }
}

// 处理滚动事件
const handleScroll = async (e: Event) => {
  if (!e.target) return

  const target = e.target as HTMLElement
  const visibleMessages = getVisibleMessages(target)

  if (visibleMessages.length > 0) {
    handleMessageScroll(visibleMessages)
  }

  // 检查是否需要加载更多历史消息
  if (target.scrollTop <= 50 && !loading.value && hasMore.value && currentChat.value) {
    await loadHistoryMessages(currentChat.value.userInfo.userId, true)
  }
}

// 标记消息已读
const markMessagesAsRead = async (messages: MessageVO[]) => {
  if (!userInfo.value?.userId) return

  try {
    const unreadMessages = messages.filter(msg =>
      msg.userId !== userInfo.value?.userId && // 发送方不是自己
      msg.messageStatus === 'offline' // 消息状态为未读
    )

    if (unreadMessages.length > 0) {
      const messageReqDTOList = unreadMessages.map(msg => ({
        userId: msg.userId,
        toUserId: msg.toUserId,
        messageId: msg.messageId,
        timestamp: msg.timestamp
      }))

      await useMessageApi.changeStatus({ messageReqDTOList })

      // 更新本地消息状态
      messages.forEach(msg => {
        if (unreadMessages.some(unread => unread.messageId === msg.messageId)) {
          msg.messageStatus = 'online'
        }
      })

      // 更新联系人未读数
      if (currentChat.value) {
        const contact = contacts.value.find(c =>
          c.userInfo.userId === currentChat.value?.userInfo.userId
        )
        if (contact) {
          contact.unreadCount = 0
        }
      }
    }
  } catch (error: any) {
    console.error('标记消息已读失败:', error)
    ElMessage.error('标记消息已读失败')
  }
}

// 在消息列表滚动时调用
const handleMessageScroll = (visibleMessages: MessageVO[]) => {
  if (visibleMessages.length > 0) {
    markMessagesAsRead(visibleMessages)
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return ''

  const messageDate = dayjs(timestamp)
  const now = dayjs()

  if (messageDate.isSame(now, 'day')) {
    return messageDate.format('HH:mm')
  } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 ' + messageDate.format('HH:mm')
  } else if (messageDate.isSame(now, 'year')) {
    return messageDate.format('MM-DD HH:mm')
  }
  return messageDate.format('YYYY-MM-DD HH:mm')
}

// 加载联系人列表
const loadContacts = async (isLoadMore = false) => {
  if (loadingContacts.value || !userInfo.value?.userId) return

  try {
    loadingContacts.value = true
    const response = await useFriendApi.page({
      userId: userInfo.value.userId,
      pageNum: contactPage.value,
      pageSize: contactPageSize.value
    })

    if (response && response.data) {
      // 获取所有联系人的最后一条消息
      const lastMessagesPromises = response.data.map(async (friend) => {
        try {
          const lastMessage = await useMessageApi.getLastMessage({
            userId: userInfo.value!.userId,
            toUserId: friend.userInfo.userId
          })
          return {
            ...friend,
            lastMessage: lastMessage?.messageType === MessageType.PHOTO ? '[图片]' : lastMessage?.messageContent,
            lastMessageTime: lastMessage?.timestamp?.toString(),
            unreadCount: 0
          }
        } catch (error) {
          console.error('获取最后消息失败:', error)
          return {
            ...friend,
            lastMessage: undefined,
            lastMessageTime: undefined,
            unreadCount: 0
          }
        }
      })

      const newContacts = await Promise.all(lastMessagesPromises)

      // 获取未读消息数量
      const userIds = newContacts.map(contact => contact.userInfo.userId)
      const offlineCountMap = await useMessageApi.getOfflineMessageCount({
        userIds,
        userId: userInfo.value.userId
      })

      console.log('offlineCountMap',offlineCountMap)

      // 更新未读消息数量
      newContacts.forEach(contact => {
        contact.unreadCount = offlineCountMap[contact.userInfo.userId] || 0
      })

      // 如果是加载更多，则追加数据
      if (isLoadMore) {
        contacts.value = [...contacts.value, ...newContacts]
      } else {
        contacts.value = newContacts
      }
      contactTotal.value = response.total
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取联系人列表失败')
  } finally {
    loadingContacts.value = false
  }
}

// 处理联系人分页变化
const handleContactPageChange = async (page: number) => {
  contactPage.value = page
  await loadContacts(true)
}

// 处理新消息
const handleNewMessage = async (message: MessageVO) => {
  // 如果是当前聊天对象的消息，添加到消息列表末尾
  if (currentChat.value?.userInfo.userId === (message.userId === userInfo.value?.userId ? message.toUserId : message.userId)) {
    const newMessage = {
      ...message,
      messageId: `temp_${Date.now()}`,
      messageStatus: 'online'
    }

    // 根据消息类型处理消息内容
    if (message.messageType === MessageType.PHOTO) {
      // 如果是图片消息，messageContent 是图片 URL
      newMessage.messageContent = message.messageContent // 图片URL
    } else if (message.messageType === MessageType.TEXT) {
      // 如果是文本消息，保持原样
      newMessage.messageContent = message.messageContent
    }

    currentMessages.value.push(newMessage)
    // 等待DOM更新后滚动到底部
    await nextTick()
    scrollToBottom()
  }

  // 更新联系人列表的最后消息
  updateContactLastMessage({
    ...message,
    // 如果是图片消息，在联系人列表显示 [图片]
    messageContent: message.messageType === MessageType.PHOTO ? '[图片]' : message.messageContent
  })
}

// 更新联系人最后消息
const updateContactLastMessage = (message: MessageVO) => {
  if (!userInfo.value) return
  
  const contactId = message.userId === userInfo.value.userId ? message.toUserId : message.userId
  const contactIndex = contacts.value.findIndex(c => c.userInfo.userId === contactId)
  
  if (contactIndex === -1) {
    if (contactPage.value === 1) {
      loadContacts()
    }
    return
  }

  // 创建更新后的联系人对象
  const updatedContact = {
    ...contacts.value[contactIndex],
    // 如果是图片消息，显示[图片]，否则显示消息内容
    lastMessage: message.messageType === MessageType.PHOTO ? '[图片]' : message.messageContent,
    lastMessageTime: (message.timestamp || Date.now()).toString(),
    unreadCount: message.userId !== userInfo.value.userId && 
                 currentChat.value?.userInfo.userId !== contactId 
                 ? (contacts.value[contactIndex].unreadCount || 0) + 1 
                 : contacts.value[contactIndex].unreadCount || 0
  }

  // 从列表中移除旧的联系人
  contacts.value.splice(contactIndex, 1)
  // 将更新后的联系人添加到列表开头
  contacts.value.unshift(updatedContact)
}

const uninstallWebSocket = () => {
  wsService.disconnect()
  wsService.setAutoReconnect(false)
}

// 初始化WebSocket消息监听
const initWebSocket = () => {
  const userId = userInfo.value?.userId
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }

  if (wsService.getReconnectAttempts() === wsService.getMaxReconnectAttempts()) {
    wsService.clearReconnectAttempts()
  }

  wsService.connect()
  wsService.setAutoReconnect(true)
  // 使用事件订阅替代重写方法
  wsService.events.on('message', (message) => {
    if (message.messageType !== MessageType.PING) {
      handleNewMessage(message)
    }
  })
  ElMessage.success('连接成功')
}

// 在组件卸载时清理事件监听
onBeforeUnmount(() => {
  wsService.events.all.clear()
  uninstallWebSocket()
})

onMounted(() => {
  loadContacts()
  initWebSocket()
  loadFriendApplies()
})

// 搜索好友
const searchFriends = async () => {
  try {
    const { data, total } = await useUserApi.search({
      keyword: friendSearchKey.value,
      pageNum: searchPage.value,
      pageSize: searchPageSize.value
    })
    searchResults.value = data
    searchTotal.value = total
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  }
}

// 添加好友
const addFriend = async (friendId: string) => {
  try {
    // 使用 ElMessageBox.prompt 让用户输入申请描述
    const { value: description } = await ElMessageBox.prompt(
      '请输入申请描述',
      '添加好友',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入申请描述',
        inputValidator: (value) => {
          if (!value) {
            return '申请描述不能为空'
          }
          if (value.length > 20) {
            return '申请描述不能超过20个字符'
          }
          return true
        }
      }
    )

    await useFriendApi.addFriendApply({
      userId: userInfo.value?.userId || '',
      appliedId: friendId,
      description: description
    })

    ElMessage.success('申请已发送')
    showFriendDialog.value = false // 关闭搜索对话框
  } catch (error: any) {
    if (error !== 'cancel') { // 忽略取消操作的错误
      ElMessage.error(error.message || '发送申请失败')
    }
  }
}

// 加载好友列表
const loadFriends = async () => {
  try {
    const { data, total } = await useFriendApi.page({
      userId: userInfo.value?.userId || '',
      pageNum: friendPage.value,
      pageSize: friendPageSize.value
    })
    friendList.value = data
    friendTotal.value = total
  } catch (error: any) {
    ElMessage.error(error.message || '获取好友列表失败')
  }
}

// 修改好友备注
const editFriendName = async (friend: FriendResp) => {
  try {
    const { value: newName } = await ElMessageBox.prompt('请输入新的备注名', '修改备注', {
      inputValue: friend.friendName || friend.userInfo.userName,
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await useFriendApi.updateName({
      userId: userInfo.value?.userId || '',
      friendId: friend.userInfo.userId,
      friendName: newName
    })
    ElMessage.success('修改成功')
    loadContacts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '修改失败')
    }
  }
}

// 删除好友
const deleteFriend = async (friendId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除该好友吗?', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    await useFriendApi.delete({ friendId })
    ElMessage.success('删除成功')
    loadContacts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 处理分页
const handleSearchPageChange = (page: number) => {
  searchPage.value = page
  searchFriends()
}

const handleFriendPageChange = (page: number) => {
  friendPage.value = page
  loadFriends()
}

// 处理好友申请
const handleAccept = async (apply: FriendApplyResp) => {
  try {
    await useFriendApi.updateFriendApply({
      userId: apply.userInfo.userId,
      appliedId: userInfo.value?.userId || '',
      applyStatus: 'agree',
      friendName: apply.userInfo.userName
    })
    ElMessage.success('已同意好友申请')
    // 重新加载好友申请列表和联系人列表
    loadFriendApplies()
    loadContacts()
    // 更新好友申请数量
    friendApplyCount.value = Math.max(0, friendApplyCount.value - 1)
  } catch (error: any) {
    ElMessage.error(error.message || '处理好友申请失败')
  }
}

const handleReject = async (apply: any) => {
  try {
    await useFriendApi.updateFriendApply({
      userId: apply.userInfo.userId,
      appliedId: userInfo.value?.userId || '',
      applyStatus: 'no_agree',
      friendName: apply.userInfo.userName
    })
    ElMessage.success('已拒绝好友申请')
    // 重新加载好友申请列表
    loadFriendApplies()
    // 更新好友申请数量
    friendApplyCount.value = Math.max(0, friendApplyCount.value - 1)
  } catch (error: any) {
    ElMessage.error(error.message || '处理好友申请失败')
  }
}

const handleFriendApplyPageChange = (page: number) => {
  friendApplyPage.value = page
  loadFriendApplies()
}

const loadFriendApplies = async () => {
  try {
    const params: FriendApplyPageReq = {
      userId: userInfo.value?.userId || '',
      pageNum: friendApplyPage.value,
      pageSize: friendApplyPageSize.value,
    }
    const data = await useFriendApi.getFriendApplyPage(params)
    friendApplyList.value = data.data
    friendApplyTotal.value = data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取好友申请列表失败')
  }
}

</script>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
  padding: 80px 20px 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  /* 防止滚动 */
}

.chat-container {
  height: calc(100vh - 100px);
  /* 减去上下padding和header高度 */
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.contact-list {
  border-right: 1px solid #ebeef5;
  background: #fafafa;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contact-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: white;
  flex-shrink: 0;
  /* 防止头部压缩 */
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-content h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  border-radius: 8px;
  font-size: 13px;
  height: 32px;
  padding: 0 12px;
}

.contact-search {
  padding: 12px;
  background: white;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  /* 防止搜索框压缩 */
}

.contact-items {
  flex: 1;
  /* 占据剩余空间 */
  overflow-y: auto;
  background: white;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f2f5;
}

.contact-item:hover {
  background-color: #f5f7fa;
}

.contact-item.active {
  background-color: #ecf5ff;
}

.contact-main {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 8px;
  /* 为右侧内容预留空间 */
}

.contact-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
  overflow: hidden;
  /* 防止内容溢出 */
}

.contact-name {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
  /* 允许内容换行 */
}

.contact-name .el-tag {
  flex-shrink: 0;
  /* 防止标签被压缩 */
  max-width: 120px;
  /* 限制标签最大宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message {
  font-size: 13px;
  color: #999;
}

.friend-phone {
  font-size: 13px;
  color: #999;
}

.manage-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  /* 推到右侧 */
  flex-shrink: 0;
  /* 防止按钮被压缩 */
}

.manage-mode {
  cursor: default;
}

.manage-mode:hover {
  background-color: #fff;
}

.manage-mode .contact-main {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
  /* 为操作按钮预留空间 */
}

/* 管理模式下的标签样式调整 */
.manage-mode .el-tag {
  flex-shrink: 0;
  /* 防止标签被压缩 */
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 12px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.unread-badge {
  margin-left: auto;
}

.chat-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: white;
  min-width: 600px;
  height: 100%;
  /* 占满容器高度 */
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  flex-shrink: 0;
  /* 防止头部压缩 */
}

.chat-header h3 {
  margin: 0;
  color: #333;
}

.message-container {
  flex: 1;
  /* 自动占据剩余空间 */
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.message-self {
  flex-direction: row-reverse;
}

.message-content {
  margin: 0 12px;
  max-width: 60%;
}

.message-bubble {
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.message-self .message-bubble {
  background: #95ec69;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #e6e6e6;
  background: white;
  flex-shrink: 0;
  /* 防止输入框压缩 */
}

.input-toolbar {
  margin-bottom: 8px;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  margin-bottom: 8px;
}

.emoji-item {
  font-size: 20px;
  text-align: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.emoji-item:hover {
  background: #f0f2f5;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.no-chat {
  flex: 1;
  /* 自动占据剩余空间 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

:deep(.el-textarea__inner) {
  resize: none;
}

.image-preview {
  position: relative;
  margin: 8px 0;
  width: fit-content;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 4px;
}

@media (max-width: 768px) {
  .app-container {
    padding: 60px 0 0 0;
    /* 移动端减少padding */
  }

  .chat-container {
    height: calc(100vh - 60px);
    border-radius: 0;
    box-shadow: none;
  }

  .contact-list {
    width: 100% !important;
    height: calc(100vh - 60px);
    position: fixed;
    left: 0;
    top: 60px;
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .contact-list.show {
    transform: translateX(0);
  }
}

/* 美化滚动条 */
.contact-items::-webkit-scrollbar {
  width: 6px;
}

.contact-items::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.contact-items::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.message-container::-webkit-scrollbar {
  width: 6px;
}

.message-container::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.message-container::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.loading-more {
  text-align: center;
  padding: 10px 0;
  color: #999;
  font-size: 14px;
}

.message-unread {
  /* 可以为未读消息添加特殊样式 */
  opacity: 0.8;
}

/* 添加新样式 */
.friend-search {
  margin-bottom: 20px;
}

/* 添加新样式 */
.friend-list {
  max-height: 400px;
  overflow-y: auto;
  /* 添加下面的样式来为分页组件留出空间 */
  padding-bottom: 20px;
}

/* 添加分页容器样式 */
:deep(.el-pagination) {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;
}

.friend-item:hover {
  background-color: #f5f7fa;
}

.add-friend-btn {
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.add-friend-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.friend-info {
  flex: 1;
  margin-left: 12px;
}

.friend-name {
  font-weight: 500;
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.friend-phone {
  font-size: 13px;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more:hover {
  background-color: #f5f7fa;
}

.load-more.is-loading {
  cursor: default;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 添加新样式 */
.friend-apply-list {
  max-height: 400px;
  overflow-y: auto;
  /* 添加下面的样式来为分页组件留出空间 */
  padding-bottom: 20px;
}

/* 添加分页容器样式 */
:deep(.el-pagination) {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.friend-apply-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;
}

.friend-apply-item:hover {
  background-color: #f5f7fa;
}

.apply-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
  /* 将按钮推到右侧 */
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.apply-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}

.apply-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  /* 如果描述太长，添加省略号 */
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-info {
  flex: 1;
  margin: 0 16px;
  min-width: 0;
}

/* 管理模式下的样式调整 */
.manage-mode .contact-name {
  margin-right: 8px;
  /* 为管理按钮预留空间 */
}

.message-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  object-fit: cover;
}
</style>