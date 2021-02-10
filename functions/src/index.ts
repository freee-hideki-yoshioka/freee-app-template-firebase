import { addMonths } from 'date-fns'
import { convertToTimeZone } from 'date-fns-timezone'
import * as functions from 'firebase-functions'
import freeeSDK from './freee_sdk/instance'
import { authApp } from './routes/auth'
import { FreeeAPI } from './services/freee-api'
import { createReadStream } from 'fs'

const baseFunction = functions.region('asia-northeast1')

exports.api = baseFunction.https.onRequest(authApp)

exports.usersMe = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getUsersMe(data.userId)
})

exports.accountItems = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getAccountItems(data.userId, data.companyId)
})

exports.postDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, params } = data
    return FreeeAPI.postDeal(userId, companyId, params)
  })

exports.postReceipt = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId } = data
    const receipt = createReadStream(
      '/Users/yoshioka-hideki/freee-work/freee-app-template-firebase/test_error.jpg'
    )

    const sendData = {
      receipt: receipt,
      company_id: companyId
    }

    return FreeeAPI.postReceipt(userId, companyId, sendData)
  })

exports.keyRotation = baseFunction.pubsub
  .schedule('0 0 28 * *')
  .onRun(async () => {
    const now = convertToTimeZone(new Date(), { timeZone: 'Asia/Tokyo' })
    const nextMonth = addMonths(now, 1)
    await freeeSDK.auth().createCryptoKey(nextMonth)
  })
