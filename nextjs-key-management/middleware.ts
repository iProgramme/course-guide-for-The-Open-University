import { NextRequest, NextResponse } from 'next/server';

// 验证凭证
const VALID_CREDENTIALS = {
  username: '2641927926',
  password: '5266632311ybw'
};

export function middleware(request: NextRequest) {
  // 允许访问登录页面
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // 检查会话
  const session = request.cookies.get('auth_session');
  
  if (!session) {
    // 重定向到登录页面
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 验证会话值
  if (session.value !== btoa(`${VALID_CREDENTIALS.username}:${VALID_CREDENTIALS.password}`)) {
    // 无效会话，重定向到登录页面
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 应用中间件到所有路由
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - 静态文件 (_next/static, _next/image, favicon.ico)
     * - 登录页面
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};