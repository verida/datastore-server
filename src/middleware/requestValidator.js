const basicAuth = require('express-basic-auth');
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'
import CeramicClient from '@ceramicnetwork/http-client'
import { DID } from 'dids'

class RequestValidator {

    /**
     * Allow access to any user who provides a valid signed message for the given application
     * 
     * @todo: cache the signature verifications
     * 
     * @param {*} did 
     * @param {*} password 
     * @param {*} req 
     */
    authorize(did, signature, req, cb) {
        did = did.replace(/_/g, ":")

        const authCheck = async () => {
            try {
                const { CERAMIC_URL }  = process.env
                const ceramic = new CeramicClient(CERAMIC_URL)
                const threeIdResolver = await ThreeIdResolver.getResolver(ceramic)
                const resolver = new Resolver(threeIdResolver)

                const didHelper = new DID({ resolver })
                const result = await didHelper.verifyJWS(signature)

                const storageContext = req.headers['application-name']
                const consentMessage = `Do you wish to unlock this storage context: "${storageContext}"?\n\n${did}`

                if (!result || result.payload.message != consentMessage) {
                    cb(null, false)
                } else {
                    cb(null, true)
                }
            } catch (err) {
                // Likeley unable to resolve DID
                cb(null, false)
            }
        }

        const promise = new Promise((resolve, rejects) => {
            authCheck()
            resolve()
        })
    }

    getUnauthorizedResponse(req) {
        return {
            status: "fail",
            code: 90,
            data: {
                "auth": "Invalid credentials supplied"
            }
        }
    }

}

let requestValidator = new RequestValidator();
export default requestValidator;