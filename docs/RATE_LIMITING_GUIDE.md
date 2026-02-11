# 🛡️ API Rate Limiting Implementation Guide

## Overview

This application implements comprehensive API rate limiting to protect against abuse, ensure fair usage, and maintain system stability. The rate limiting system uses a token bucket algorithm with multiple strategies and configurations.

## 🏗️ Architecture

### Core Components

1. **Rate Limiter Core** (`src/lib/rate-limiting.ts`)
   - Token bucket algorithm implementation
   - Multiple rate limit configurations
   - Key generation strategies
   - Automatic cleanup of expired entries

2. **Middleware** (`src/lib/middleware/rate-limit-middleware.ts`)
   - Easy-to-use middleware for API routes
   - Multiple limiting strategies (IP, User, Combined)
   - Automatic header injection
   - Error handling and logging

3. **API Integration**
   - Applied to critical endpoints
   - Different limits for different endpoint types
   - User role-based limiting

## 📊 Rate Limit Configurations

### Predefined Limits

| Endpoint Type       | Window     | Max Requests | Strategy  | Use Case             |
| ------------------- | ---------- | ------------ | --------- | -------------------- |
| **Authentication**  | 15 minutes | 5 requests   | IP        | Login attempts       |
| **API General**     | 1 minute   | 60 requests  | IP + User | General API usage    |
| **Admin**           | 1 minute   | 30 requests  | User      | Admin operations     |
| **User Management** | 5 minutes  | 10 requests  | User      | User CRUD operations |
| **File Upload**     | 1 minute   | 5 requests   | User      | File uploads         |
| **General**         | 1 minute   | 100 requests | IP        | Public endpoints     |

### Rate Limiting Strategies

1. **IP-based** (`ip`): Limits based on client IP address
2. **User-based** (`user`): Limits based on authenticated user ID
3. **Combined** (`ip_user`): Limits based on both IP and user
4. **Endpoint-specific** (`endpoint`): Limits per specific API endpoint
5. **Role-based** (`role`): Different limits based on user role

## 🚀 Usage Examples

### Basic API Route Protection

```typescript
import { rateLimiters } from '@/lib/middleware/rate-limit-middleware'

export async function GET(request: NextRequest) {
  return rateLimiters.api(request, async (req: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ data: 'success' })
  })
}
```

### Custom Rate Limiting

```typescript
import { createRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rate-limit-middleware'

const customRateLimit = createRateLimit({
  config: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests
    message: 'Custom limit exceeded',
  },
  strategy: 'user',
})

export async function POST(request: NextRequest) {
  return customRateLimit(request, async (req: NextRequest) => {
    // Your logic here
  })
}
```

### Higher-Order Function Approach

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

const handler = withRateLimit(
  async (request: NextRequest) => {
    // Your handler logic
    return NextResponse.json({ success: true })
  },
  {
    config: RATE_LIMIT_CONFIGS.ADMIN,
    strategy: 'user',
  },
)

export { handler as GET }
```

## 🔧 Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # Optional: For distributed systems
```

### Custom Configurations

```typescript
import { RateLimitConfig } from '@/lib/rate-limiting'

const customConfig: RateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20, // 20 requests
  message: 'Too many requests from this user',
  headers: true, // Include rate limit headers
  keyGenerator: (id) => `custom:${id}`,
}
```

## 📈 Monitoring & Management

### Rate Limit Status API

**GET** `/api/rate-limit/status`

- Check current rate limit status
- Available to authenticated users
- Returns limits for different strategies

```json
{
  "success": true,
  "ip": "192.168.1.1",
  "userId": "user123",
  "userRole": "User",
  "statuses": {
    "ip": {
      "success": true,
      "limit": 60,
      "remaining": 45,
      "resetTime": 1640995200000
    },
    "user": {
      "success": true,
      "limit": 60,
      "remaining": 50,
      "resetTime": 1640995200000
    }
  }
}
```

### Rate Limit Statistics API

**GET** `/api/rate-limit/stats` (SuperAdmin only)

- View comprehensive rate limiting statistics
- Monitor active limits and violations
- Identify potential abuse patterns

```json
{
  "success": true,
  "stats": {
    "total": 150,
    "byType": {
      "ip": 80,
      "user": 50,
      "endpoint": 20
    },
    "byStatus": {
      "active": 140,
      "nearLimit": 8,
      "exceeded": 2
    }
  }
}
```

### Reset Rate Limits

**POST** `/api/rate-limit/status` (SuperAdmin only)

- Reset rate limits for specific users or IPs
- Emergency override capability

```json
{
  "targetUserId": "user123",
  "targetIp": "192.168.1.1",
  "limitType": "API"
}
```

## 🔍 Response Headers

When rate limiting is active, responses include these headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 30  # Only when limit exceeded
```

## ⚠️ Rate Limit Exceeded Response

When rate limit is exceeded, clients receive:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 30
}
```

**Status Code:** `429 Too Many Requests`

## 🛠️ Implementation Details

### Applied Endpoints

Currently rate-limited endpoints:

1. **Admin User Management** (`/api/admin/users/*`)
   - Strategy: User-based
   - Limit: 30 requests/minute

2. **Traveller Management** (`/api/travellers/*`)
   - Strategy: IP + User combined
   - Limit: 60 requests/minute

3. **Authentication** (Handled by NextAuth.js)
   - Strategy: IP-based
   - Limit: 5 attempts/15 minutes

### Key Generation

The system uses intelligent key generation:

```typescript
// Examples of generated keys
'ip:192.168.1.1' // IP-based
'user:user123' // User-based
'ip_user:192.168.1.1:user123' // Combined
'endpoint:/api/users:192.168.1.1' // Endpoint-specific
'role:Admin:192.168.1.1' // Role-based
```

## 🔄 Future Enhancements

### Planned Improvements

1. **Redis Integration**
   - Distributed rate limiting for multi-server deployments
   - Persistent rate limit data across server restarts

2. **Dynamic Rate Limits**
   - Adjust limits based on server load
   - User tier-based limiting (Premium users get higher limits)

3. **Advanced Analytics**
   - Rate limit violation patterns
   - Automatic IP blocking for repeated violations
   - Integration with security monitoring

4. **Whitelist/Blacklist**
   - IP whitelist for trusted sources
   - Automatic blacklisting of abusive IPs

### Redis Integration Example

```typescript
// Future Redis implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.RATE_LIMIT_REDIS_URL)

class RedisRateLimiter {
  async checkLimit(key: string, config: RateLimitConfig) {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000))
    }
    return {
      success: current <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current),
    }
  }
}
```

## 🚨 Security Considerations

1. **IP Spoofing Protection**
   - Uses multiple headers to detect real IP
   - Handles proxy and CDN scenarios

2. **Memory Management**
   - Automatic cleanup of expired entries
   - Configurable memory limits

3. **Error Handling**
   - Graceful degradation if rate limiter fails
   - Comprehensive error logging

4. **Production Safety**
   - Rate limiting continues even if monitoring fails
   - No sensitive data in rate limit logs

## 📚 Best Practices

1. **Choose Appropriate Limits**
   - Start conservative, adjust based on usage patterns
   - Consider legitimate use cases

2. **Monitor Regularly**
   - Check rate limit statistics
   - Identify and investigate violations

3. **Provide Clear Feedback**
   - Include helpful error messages
   - Use appropriate HTTP status codes

4. **Plan for Scale**
   - Consider Redis for distributed systems
   - Monitor memory usage in high-traffic scenarios

## 🔧 Troubleshooting

### Common Issues

1. **Rate Limits Too Strict**
   - Monitor `/api/rate-limit/stats` for frequent violations
   - Adjust limits in `RATE_LIMIT_CONFIGS`

2. **Memory Usage**
   - Check rate limiter statistics
   - Adjust cleanup intervals if needed

3. **False Positives**
   - Review IP detection logic
   - Consider user-based limiting for authenticated users

### Debug Mode

Enable debug logging in development:

```env
NODE_ENV=development
```

This will log rate limit operations to console for debugging.

---

## 📞 Support

For questions or issues with rate limiting:

1. Check the rate limit status API
2. Review error logs for rate limit violations
3. Monitor system performance impact
4. Adjust configurations as needed

The rate limiting system is designed to be robust, scalable, and easy to configure for your specific needs.
