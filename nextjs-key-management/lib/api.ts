import type { NextApiRequest, NextApiResponse } from 'next';

// 定义API响应的类型
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// 通用的API处理函数
export const handleApi = async <T>(
  handler: () => Promise<T>,
  res: NextApiResponse<ApiResponse<T>>
) => {
  try {
    const data = await handler();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};