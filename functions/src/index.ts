import { addMonths } from 'date-fns'
import { convertToTimeZone } from 'date-fns-timezone'
import * as functions from 'firebase-functions'
import freeeSDK from './freee_sdk/instance'
import { authApp } from './routes/auth'
import { FreeeAPI } from './services/freee-api'
import * as admin from 'firebase-admin'
import { createReadStream } from 'fs'
admin.initializeApp()
const baseFunction = functions.region('asia-northeast1')

exports.api = baseFunction.https.onRequest(authApp)

exports.getFunction = baseFunction.https.onCall(() => {
  return 'success_getFunction'
})

exports.getFirestore = baseFunction.https.onCall(() => {
  /*
  const test = async (data: any, context: any) => {
    await admin.firestore().collection("freeeTokens").get()
  }
  for (let step = 0; step < 5; step++) {
    console.log(test[step])
  }
*/
  return async (data: any, context: any) => {
    await admin
      .firestore()
      .collection('freeeTokens')
      .where('algorithm', '==', 'aes-256-cbc')
      .get()
      .then(doc => {
        console.log(doc)
      })
  }

  //return admin.firestore().collection("freeeTokens").get().then((doc) => {console.log(doc)})
  // return admin.firestore().collection("freeeTokens").doc("3194568").get()
  /*
  return admin.firestore().collection("freeeTokens").get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        return console.log(doc.id, " => ", doc.data());
    });
*/
  /*
  return admin.firestore()
      .collection("freeeTokens")
      .doc("3194568")
      .get()
      .then((doc) => {
        return doc.exists
      })
*/
  // return admin.firestore().doc(`/freeeTokens/3194568`).get()
})

exports.usersMe = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getUsersMe(data.userId)
})

exports.accountItems = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getAccountItems(data.userId, data.companyId)
})

exports.getDeal = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.getDeal(data.userId, data.companyId, data.id)
})

exports.postDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, params } = data
    return FreeeAPI.postDeal(userId, companyId, params)
  })

exports.putDeal = baseFunction
  .runWith({ timeoutSeconds: 180 })
  .https.onCall((data: any) => {
    const { userId, companyId, id, params } = data
    return FreeeAPI.putDeal(userId, companyId, id, params)
  })

exports.deleteDeal = baseFunction.https.onCall((data: any) => {
  return FreeeAPI.deleteDeal(data.userId, data.companyId, data.id)
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
