const basicAuth = require('express-basic-auth');
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import { Resolver } from 'did-resolver'
import CeramicClient from '@ceramicnetwork/http-client'
import { DID } from 'dids'

const CERAMIC_URL = 'http://localhost:7007'

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
    async authorize(did, signature, req) {
        did = did.replace(/_/g, ":");

        const ceramic = new CeramicClient(CERAMIC_URL)
        const threeIdResolver = await ThreeIdResolver.getResolver(ceramic)
        const resolver = new Resolver(threeIdResolver)

        const didHelper = new DID({ resolver })
        const result = await didHelper.verifyJWS(signature)

        const storageContext = req.headers['application-name']
        const consentMessage = `Do you wish to unlock this storage context: "${storageContext}"?\n\n${did}`

        if (!result || result.payload.message != consentMessage) {
            return false
        }

        return true
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