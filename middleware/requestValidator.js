const basicAuth = require('express-basic-auth');
import DIDHelper from '@verida/did-helper';

class RequestValidator {

    /**
     * Allow access to any user who provides a valid signed message for the given application
     * 
     * @param {*} did 
     * @param {*} password 
     * @param {*} req 
     */
    authorize(did, signature, req) {
        did = did.replace(/_/g, ":");
        
        let applicationName = req.headers['application-name'];
        let profileRequest = req.headers['profile-request'];

        let message = "Do you approve access to view and update \""+applicationName+"\"?\n\n" + did;
        if (profileRequest == 'true') {
            message = "Do you approve this application to update your Verida public profile?\n\n" + did;
        }

        const signingAddress = DIDHelper.verifySignedMessage(did, message, signature)

        // Check for an invalid address
        if (!signingAddress) {
            return false;
        }
        
        return true;
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