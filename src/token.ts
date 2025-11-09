import { SignJWT } from 'jose'
const cfg = {
  accessKey: 'next68f09cce172aa643e308679c',
  accessSecret: '-v8kx6R32xqMQQ8LXGBNXMEsiKeQoL6i3sdW1NsSSX',
  visitId: '105908',
  visitName: '小开',
}
export const createAccessToken = async (
  accessKey = cfg.accessKey,
  accessSecret = cfg.accessSecret,
  visitId = cfg.visitId,
  visitName = cfg.visitName
) => {
  // 定义令牌的有效负载
  const payload = {
    role: 'role.visit',
    visitId: visitId.trim(),
    visitName: visitName.trim(),
    timestamp: Date.now(),
    noncestr: Math.random().toString(36).substr(2, 15),
  }

  // 使用 SignJWT 创建签名的 JWT
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // 设置算法
    .setIssuedAt() // 设置颁发时间
    .setExpirationTime('24h') // 设置过期时间为24小时
    .sign(new TextEncoder().encode(accessSecret)) // 签名令牌

  // 返回格式化的访问令牌
  return `${accessKey}@${token}`
}
