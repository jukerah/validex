import vkrun, { Router, cors } from '../../../index'
import axios from 'axios'
import * as util from '../../utils'
import * as type from '../../types'

describe('Cors - end to end testing using axios and app server', () => {
  let server: any

  afterEach(() => {
    // close server if test fails or causes error
    if (server?.listening) {
      server.close()
    }
  })

  it('Should return status 200 when default cors', async () => {
    const app = vkrun()
    app.use(cors())
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    app.use(router)
    server = app.server()
    server.listen(3599)

    await axios.get('http://localhost:3599/').then((response) => {
      expect(response.status).toEqual(200)
      expect(response.data).toEqual('GET ok')
      expect(Object.keys(response.headers).length).toEqual(7)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['access-control-allow-origin']).toEqual('*')
      expect(response.headers['access-control-allow-methods']).toEqual('GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS')
      expect(response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('6')
    })

    app.close()
  })

  it('Should return status 403 if the request origin is not in the origin options', async () => {
    const app = vkrun()
    const options: type.SetCorsOptions = {
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
      preflightNext: false,
      successStatus: 204,
      allowedHeaders: 'Content-Type, Authorization',
      exposedHeaders: 'X-Another-Custom-Header',
      credentials: true,
      maxAge: 3600
    }
    app.use(cors(options))
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    app.use(router)
    server = app.server()
    server.listen(3598)

    await axios.get('http://localhost:3598/').catch((error: any) => {
      expect(error.response.status).toEqual(403)
      expect(Object.keys(error.response.headers).length).toEqual(6)
      expect(util.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['access-control-allow-origin']).toEqual('http://localhost:3000')
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(error.response.headers.date)).toBeTruthy()
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('0')
      expect(error.response.data).toEqual('')
    })

    app.close()
  })

  it('Should return status 403 if the request origin is not in the origin array options', async () => {
    const app = vkrun()
    const options: type.SetCorsOptions = {
      origin: ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
      preflightNext: false,
      successStatus: 204,
      allowedHeaders: 'Content-Type, Authorization',
      exposedHeaders: 'X-Another-Custom-Header',
      credentials: true,
      maxAge: 3600
    }
    app.use(cors(options))
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    app.use(router)
    server = app.server()
    server.listen(3597)

    await axios.get('http://localhost:3597/').catch((error: any) => {
      expect(error.response.status).toEqual(403)
      expect(error.response.data).toEqual('')
      expect(Object.keys(error.response.headers).length).toEqual(6)
      expect(util.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['access-control-allow-origin']).toEqual('http://localhost:3000')
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(util.isString(error.response.headers.date)).toBeTruthy()
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('0')
    })

    app.close()
  })

  it('Should return status 204 when method is OPTIONS and valid origin', async () => {
    const app = vkrun()
    const options: type.SetCorsOptions = {
      origin: 'http://localhost:3596',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
      preflightNext: false,
      successStatus: 204,
      allowedHeaders: 'Content-Type, Authorization',
      exposedHeaders: 'X-Another-Custom-Header',
      credentials: true,
      maxAge: 3600
    }
    app.use(cors(options))
    const router = Router()

    router.get('/route', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    app.use(router)
    server = app.server()
    server.listen(3596)

    await axios.options('http://localhost:3596/route', {
      headers: {
        Origin: 'http://localhost:3596'
      }
    }).then((response) => {
      expect(response.status).toEqual(204)
      expect(response.data).toEqual('')
      expect(Object.keys(response.headers).length).toEqual(10)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['access-control-allow-origin']).toEqual('http://localhost:3596')
      expect(response.headers['access-control-allow-methods']).toEqual('GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS')
      expect(response.headers['access-control-expose-headers']).toEqual('X-Another-Custom-Header')
      expect(response.headers['access-control-allow-credentials']).toEqual('true')
      expect(response.headers['access-control-max-age']).toEqual('3600')
      expect(response.headers['access-control-allow-headers']).toEqual('Content-Type, Authorization')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('0')
    })

    app.close()
  })

  it('Should add default CORS options handler when route does not have OPTIONS method defined', async () => {
    const app = vkrun()
    app.use(cors())
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.status(200).json({ message: 'GET ok' })
    })

    app.use(router)
    server = app.server()
    server.listen(3595)

    await axios.options('http://localhost:3595/').then((response) => {
      expect(response.status).toEqual(204)
      expect(response.data).toEqual('')
      expect(Object.keys(response.headers).length).toEqual(7)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['access-control-allow-origin']).toEqual('*')
      expect(response.headers['access-control-allow-methods']).toEqual('GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS')
      expect(response.headers['access-control-allow-headers']).toEqual('Content-Type, Authorization')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('0')
    })

    app.close()
  })

  it('Should use custom CORS options handler when route has OPTIONS method defined', async () => {
    const app = vkrun()
    app.use(cors())
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    router.options('/', (_request: type.Request, response: type.Response) => {
      response.status(200).end()
    })

    app.use(router)
    server = app.server()
    server.listen(3594)

    await axios.options('http://localhost:3594/').then((response) => {
      expect(response.status).toEqual(204)
      expect(response.data).toEqual('')
      expect(Object.keys(response.headers).length).toEqual(7)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['access-control-allow-origin']).toEqual('*')
      expect(response.headers['access-control-allow-methods']).toEqual('GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS')
      expect(response.headers['access-control-allow-headers']).toEqual('Content-Type, Authorization')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('0')
    })

    app.close()
  })

  it('Should use custom CORS options handler when route has OPTIONS method defined and preflightNext is false', async () => {
    const app = vkrun()
    app.use(cors({ preflightNext: true }))
    const router = Router()

    router.get('/', (_request: type.Request, response: type.Response) => {
      response.setHeader('Content-Type', 'text/plain')
      response.status(200).end('GET ok')
    })

    router.options('/', (_request: type.Request, response: type.Response) => {
      response.status(200).end('OPTIONS ok')
    })

    app.use(router)
    server = app.server()
    server.listen(3593)

    await axios.options('http://localhost:3593/').then((response) => {
      expect(response.status).toEqual(200)
      expect(response.data).toEqual('')
      expect(Object.keys(response.headers).length).toEqual(7)
      expect(util.isUUID(response.headers['request-id'])).toBeTruthy()
      expect(response.headers['access-control-allow-origin']).toEqual('*')
      expect(response.headers['access-control-allow-methods']).toEqual('GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS')
      expect(response.headers['access-control-allow-headers']).toEqual('Content-Type, Authorization')
      expect(util.isString(response.headers.date)).toBeTruthy()
      expect(response.headers.connection).toEqual('close')
      expect(response.headers['content-length']).toEqual('0')
    })

    app.close()
  })
})
