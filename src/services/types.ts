// 请求响应的通用格式
export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

// 自定义错误
export class ServiceError extends Error {
  constructor(
    public code: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface PageDTO<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
