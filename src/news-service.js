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

const template = require('string-placeholder')
const request = require('request-promise-native')
const stream = require('stream')
const readline = require('readline-promise').default
const showdown = require('showdown')

const LANGUAGE_FILE = 'languages'
const INDEX_FILE = 'index'
const DEFAULT_LANGUAGE = 'en'

const converter = new showdown.Converter({
  simplifiedAutoLink: true,
  openLinksInNewWindow: true,
  metadata: true
})

class NewsService {

  constructor({ config, language, logger }) {
    this.config = config 
    this.language = language
    this.logger = logger
  }

  async fetchNews() {
    if (this.news) {
      return this.news
    }

    const newsRepoUrlTemplate = this.config.news.repository.url
    this.logger.debug('newsRepoUrlTemplate = %s', newsRepoUrlTemplate)
    const newsRepoUrl = template(newsRepoUrlTemplate, { WP_APP_REGION_ID: process.env.WP_APP_REGION_ID })
    this.logger.debug('newRepoUrl = %s', newsRepoUrl)

    const languageFileUrl = newsRepoUrl + LANGUAGE_FILE
    this.logger.debug('languageFileUrl = %s', languageFileUrl)
    const languageFileContents = await this.readFileLines(languageFileUrl)
    this.logger.debug('languageFileContents = %s', languageFileContents)

    const newsLanguage = languageFileContents.includes(this.language) ? this.language : DEFAULT_LANGUAGE
    this.logger.debug('newsLanguage = %s', newsLanguage)

    const indexFileUrl = newsRepoUrl + newsLanguage + '/' + INDEX_FILE
    this.logger.debug('indexFileUrl = %s', indexFileUrl)
    const indexFileContents = await this.readFileLines(indexFileUrl)
    this.logger.debug('indexFileContents = %s', indexFileContents)

    const newsFileContents = await Promise.all(indexFileContents.map((newsFileName) => {
      const newsFileUrl = newsRepoUrl + newsLanguage + '/' + newsFileName
      this.logger.debug('newsFileUrl = %s', newsFileUrl)
      return request(newsFileUrl).promise()
    }))

    this.news = newsFileContents.map((newsFileContent) => {
      const content = converter.makeHtml(newsFileContent)
      const metadata = converter.getMetadata()
      return { content, metadata }
    })

    return this.news
  }

  async readFileLines(fileUrl) {
    const fileContent = await request(fileUrl).promise()
    const bufferStream = new stream.PassThrough()
    bufferStream.end(Buffer.from(fileContent))
    const rlp = readline.createInterface({ input: bufferStream })
    const lines = []
    await rlp.each((line, index) => {
      lines.push(line)
    })
    return lines;
  }

}

module.exports = NewsService