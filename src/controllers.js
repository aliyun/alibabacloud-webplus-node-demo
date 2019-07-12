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

const NewsService = require('./news-service')
const template = require('string-placeholder')

const i18n = (ctx) => {
  return () => {
    return (text, render) => {
      const frag = render(text)
      ctx.log.debug('frag = %s', frag)

      let result, key = frag, args = []
      const keyPattern = /^(.*?)\s/g
      while (result = keyPattern.exec(frag)) {
        key = result[1]
      }
      ctx.log.debug('key = %s', key)

      const argsPattern = /\[(.*?)\]/g
      while (result = argsPattern.exec(frag)) {
        args.push(result[1])
      }
      ctx.log.debug('args = %o', args)

      return ctx.__(key, args)
    }
  }
}

module.exports = (router, config) => {

  router.get('/', async (ctx) => {
    const newsService = new NewsService({
      config,
      language: ctx.__getLocale(),
      logger: ctx.log
    }) 

    const model = {
      i18n: i18n(ctx),
      news: await newsService.fetchNews(),
      siteId: config.site.id,
      quickstartDocUrl: config.quickstart.doc.url,
      quickstartRepoName: config.quickstart.repo.name,
      quickstartRepoUrl: config.quickstart.repo.url,
      appUrl: template(config.app.url, {
        WP_APP_REGION_ID: process.env.WP_APP_REGION_ID,
        WP_APP_ID: process.env.WP_APP_ID
      }),
      envUrl: template(config.env.url, {
        WP_APP_REGION_ID: process.env.WP_APP_REGION_ID,
        WP_APP_ID: process.env.WP_APP_ID,
        WP_ENV_ID: process.env.WP_ENV_ID
      }),
      nextStep: config.next.step.show,
      nextStepPackageUrl: template(config.next.step.package.url, {
        WP_APP_REGION_ID: process.env.WP_APP_REGION_ID
      }),
      consoleUrl: config.webplus.console.url,
      envs: {
        appRegionId: process.env.WP_APP_REGION_ID,
        appId: process.env.WP_APP_ID,
        appName: process.env.WP_APP_NAME,
        envId: process.env.WP_ENV_ID,
        envName: process.env.WP_ENV_NAME,
        fromCLI: 'CLI' === process.env.WP_CHANGE_TRIGGER_FROM,
        fromConsole: 'Console' === process.env.WP_CHANGE_TRIGGER_FROM
      }
    }

    ctx.ok(await ctx.render('index', model))
  })

  router.get('/health', (ctx) => {
    ctx.ok('OK')
  })

  return router
}