import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ServiceError } from './types';
import router from '@/router';

// 统一使用 ResponseData 作为响应格式
export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export class HttpClient {
  private instance: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const userId = localStorage.getItem('userId');
        if (userId) {
          config.headers.HEADER_USER_ID = userId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseData>) => {
        const { code, message, data } = response.data;

        if (code === 200) {
          return data;  // 直接返回 data 数据
        }
        
        throw new ServiceError(code, message, data);
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;

          if(status == 401){
            localStorage.removeItem('userId');
            localStorage.removeItem('userInfo');
            router.push('/login');
          }

          if (status === 403) {
            localStorage.removeItem('userId');
            localStorage.removeItem('userInfo');
            router.push('/login');
          }

          throw new ServiceError(
            status,
            data.message || '请求失败',
            data
          );
        }
        throw new ServiceError(-1, error.message || '网络错误');
      }
    );
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.delete(url, config);
  }
}

// 导出默认实例
export const http = new HttpClient();