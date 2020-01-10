import App from './app'

import * as bodyParser from 'body-parser'
import loggerMiddleware from './middlewares/logger'

import IcalController from './controllers/ical.controller'

const app = new App({
  port: 80,
  controllers: [
    new IcalController(),
  ],
  middleWares: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    loggerMiddleware
  ]
})

app.listen()