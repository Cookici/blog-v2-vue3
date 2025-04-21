// 用户信息接口
export interface UserInfo {
    userId: string;
    userName: string;
    userPhone: string;
    userLevel: number;
    userSex: string;
    userBirthday: string;  // LocalDateTime 转为 string
    creatTime: string;     // LocalDateTime 转为 string
    userIp: string;
    userEmail: string;
    userPhoto: string;
  }

  export interface loginResponse {
    userInfo: UserInfo;
    token: string;
  }
  
  // API 相关接口
  export interface LoginParams {
    userPhone: string;
    userPassword: string;
  }
  
  export interface RegisterParams {
    userName: string;
    userPassword: string;
    userPasswordAgain: string;
    userPhone: string;
    userLevel?: number;
    userBirthday?: string;
    userSex?: string;
    roleName?: string;
    userEmail?: string;
    userIp?: string;
  }
  
  export interface RegisterResponse {
    userPhone: string;
  }


  export interface UserSearchReq {
    keyword: string
    pageNum: number
    pageSize: number
  }