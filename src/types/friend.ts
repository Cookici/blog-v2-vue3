import type { UserInfo } from './user'

// 好友响应数据
export interface FriendResp {
  userInfo: UserInfo
  friendName: string
}

export interface FriendUpdateNameReq {
  userId: string
  friendId: string
  friendName: string
}

export interface FriendDeleteReq {
  friendId: string
}

// 分页查询参数
export interface FriendPageReq {
  userId: string
  pageNum: number
  pageSize: number
}

export interface FriendApplyResp {
  userInfo: UserInfo;
  description: string;
}

export interface FriendApplyPageReq {
  userId: string;
  pageNum: number;
  pageSize: number;
}

export interface FriendApplyAddReq {
  userId: string;
  appliedId: string;
  description:string
}

export interface FriendApplyUpdateReq {
  userId: string;
  appliedId: string;
  applyStatus:string;
  friendName:string;
}