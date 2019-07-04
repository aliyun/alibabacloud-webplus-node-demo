/*
 * MIT License
 *
 * Copyright (c) 2019-present Alibaba Group
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const dotenv = require('dotenv')
const config = require('config-yml');
const pino = require('pino')
const Koa = require('koa')
const helmet = require('koa-helmet')
const pinoLogger = require('koa-pino-logger')
const staticServe = require('koa-static')
const cors = require('@koa/cors')
const locales = require('koa-locales')
const parser = require('accept-language-parser')
const bodyParser = require('koa-bodyparser')
const respond = require('koa-respond')
const views = require('koa-views')
const Router = require('koa-router')
const createControllers = require('./controllers')

dotenv.config()

const logger = pino({ level: config.logging.level || process.env.LOG_LEVEL || 'info' })

const app = new Koa()
app.use(helmet())
app.use(pinoLogger({ logger }))
app.use(staticServe(`${process.cwd()}/static`))
app.use(cors())
locales(app, {
  writeCookie: false
})
app.use(async (ctx, next) => {
  const acceptLanguage = ctx.header['accept-language']
  ctx.log.debug('acceptLanguage = %s', acceptLanguage)
  const languages = parser.parse(acceptLanguage)
  if (languages.length > 0) {
    const language = languages[0].code
    ctx.log.debug('language = %s', language)
    ctx.__setLocale(language)
  }
  await next()
})
app.use(bodyParser())
app.use(respond({ autoMessage: false }))
app.use(views(
  `${process.cwd()}/views`,
  {
    autoRender: false,
    extension: 'mustache',
    map: { 'mustache': 'mustache' }
  }
))

const router = createControllers(new Router(), config)
app.use(router.routes())
app.use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, () => logger.info('Server started on port %s.', port))