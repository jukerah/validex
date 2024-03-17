import axios from 'axios'
import vkrun, { rateLimit, Router, controllerAdapter } from '../../../index'
import * as util from '../../utils'
import * as type from '../../types'

class RateLimitController implements type.Controller {
  public handle (_request: type.Request, response: type.Response): any {
    response.status(200).send('rate limit')
  }
}

describe('Rate Limit - end to end testing using axios and app server', () => {
  let server: any

  afterEach(() => {
    // close server if test fails or causes error
    if (server?.listening) {
      server.close()
    }
  })

  it('Should be able to call any route with default standard headers', async () => {
    const app = vkrun()
    const rateLimitConfig = { windowMs: 15 * 60 * 1000, limit: 100 }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    server = app.server()

    server.listen(3899)

    await axios.get('http://localhost:3899/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    app.close()
  })

  it('Should be able to call any route with legacy headers', async () => {
    const app = vkrun()
    const rateLimitConfig = {
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: false,
      legacyHeaders: true
    }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    server = app.server()

    server.listen(3898)

    await axios.get('http://localhost:3898/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit-legacy')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining-legacy')
      expect(response.headers).toHaveProperty('x-ratelimit-reset-legacy')
      expect(response.headers['x-ratelimit-limit-legacy']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining-legacy']).toBeDefined()
      expect(response.headers['x-ratelimit-reset-legacy']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    app.close()
  })

  it('Should be able to call any route with standard headers and legacy headers', async () => {
    const app = vkrun()
    const rateLimitConfig = {
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: true
    }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    server = app.server()

    server.listen(3897)

    await axios.get('http://localhost:3897/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(11)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit-legacy')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.headers).toHaveProperty('x-ratelimit-limit-legacy')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining-legacy')
      expect(response.headers).toHaveProperty('x-ratelimit-reset-legacy')
      expect(response.headers['x-ratelimit-limit-legacy']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining-legacy']).toBeDefined()
      expect(response.headers['x-ratelimit-reset-legacy']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    app.close()
  })

  it('Return to many requests if limit is reached', async () => {
    const app = vkrun()
    const rateLimitConfig = { windowMs: 15 * 60 * 1000, limit: 1 }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    server = app.server()

    server.listen(3896)

    await axios.get('http://localhost:3896/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    await axios.get('http://localhost:3896/rate-limit').catch((error) => {
      expect(error.response.status).toEqual(429)
      expect(Object.keys(error.response.headers).length).toEqual(5)
      expect(util.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(error.response.headers.date)).toBeTruthy()
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('17')
      expect(error.response.data).toEqual('Too Many Requests')
    })

    app.close()
  })

  it('Return to many requests if limit is reached and reset count requests', async () => {
    const app = vkrun()
    const rateLimitConfig = { windowMs: 50, limit: 1 }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    const server = app.server()

    server.listen(3895)

    await axios.get('http://localhost:3895/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    await axios.get('http://localhost:3895/rate-limit').catch((error) => {
      expect(error.response.status).toEqual(429)
      expect(Object.keys(error.response.headers).length).toEqual(5)
      expect(util.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(error.response.headers.date)).toBeTruthy()
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('17')
      expect(error.response.data).toEqual('Too Many Requests')
    })

    const delay = async (ms: number): Promise<void> => await new Promise<void>((resolve) => setTimeout(resolve, ms))

    await delay(100)

    await axios.get('http://localhost:3895/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    app.close()
  })

  it('Return to many requests if limit is reached and call notification', async () => {
    let accessData: any
    const app = vkrun()
    const rateLimitConfig = {
      windowMs: 50,
      limit: 1,
      minToNotification: 1,
      notification: (access: type.AccessData) => {
        accessData = access
      }
    }
    app.use(rateLimit(rateLimitConfig))
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    const server = app.server()

    server.listen(3894)

    await axios.get('http://localhost:3894/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual(String(rateLimitConfig.limit))
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    await axios.get('http://localhost:3894/rate-limit').catch((error) => {
      expect(error.response.status).toEqual(429)
      expect(Object.keys(error.response.headers).length).toEqual(5)
      expect(util.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(error.response.headers.date)).toBeTruthy()
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('17')
      expect(error.response.data).toEqual('Too Many Requests')
    })

    expect(accessData.remoteAddress).toEqual('::1')
    expect(accessData.remoteFamily).toEqual('IPv6')
    expect(accessData.userAgent).toEqual('axios/1.6.7')
    expect(accessData.exceeded.count).toEqual(1)

    const requests = accessData.exceeded.requests
    expect(accessData.exceeded.requests.length).toEqual(1)
    expect(requests[0].method).toEqual('GET')
    expect(requests[0].route).toEqual('/rate-limit')
    expect(util.isUUID(requests[0].requestId)).toBeTruthy()

    app.close()
  })

  it('Should be able to call any route with default config', async () => {
    const app = vkrun()
    app.use(rateLimit())
    const router = Router()
    router.get('/rate-limit', controllerAdapter(new RateLimitController()))
    app.use(router)
    const server = app.server()

    server.listen(3892)

    await axios.get('http://localhost:3892/rate-limit').then((response) => {
      expect(response.status).toEqual(200)
      expect(Object.keys(response.headers).length).toEqual(8)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('10')
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      expect(response.headers['x-ratelimit-limit']).toEqual('100')
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
      expect(response.data).toEqual('rate limit')
    })

    app.close()
  })
})
