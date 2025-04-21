import { http } from '../http';
import type { 
  UserInfo, 
  LoginParams, 
  RegisterParams, 
  RegisterResponse ,
  UserSearchReq,
  loginResponse
} from '@/types/user';
import { PageDTO } from '../types';

interface UserUpdateReq {
  userId: string
  userName: string
  userSex: string
  userBirthday: string
}

// 用户相关接口
export const useUserApi = {
  // 登录
  login(params: LoginParams) {
    return http.post<loginResponse>('/user/login', params);
  },

  // 登出
  logout(){
    return http.post('/user/logout')
  },
  
  // 修改注册方法的返回类型
  register(params: RegisterParams) {
    return http.post<RegisterResponse>('/user/register', params);
  },

  // 更新用户信息
  updateProfile(params: UserUpdateReq) {
    return http.post<void>('/user/update', params);
  },

  // 上传头像
  uploadAvatar(formData: FormData) {
    return http.post<{ fileUrl: string }>('/user/update_avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },


  // 获取IP地址
  getIpLocation(ip: string) {
    return http.get<string>(`/user/parseIp?ip=${ip}`);
  },

 // 更新IP地址
 updateIp(params: {userId: string}) {
  return http.post<string>(`/user/update_ip`,params);
},

  // 搜索好友
  search(params: UserSearchReq) {
    return http.get<PageDTO<UserInfo>>('/user/search', { params })
  }
}; 