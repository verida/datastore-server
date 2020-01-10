const basicAuth = require('express-basic-auth');
const ethers = require('ethers')

class RequestValidator {

    /**
     * Allow access to any user who provides a valid signed message for the given application
     * 
     * @param {*} did 
     * @param {*} password 
     * @param {*} req 
     */
    authorize(did, password, req) {
        did = did.replace(/_/g, ":");
        
        let applicationName = req.headers['application-name'];
        let message = "Do you approve access to view and update \""+applicationName+"\"?\n\n" + did;

        let address = false;
        let matches = did.match(/0x([a-z0-9]*)/);
        if (matches.length >1) {
            address = '0x' + matches[1];
        }

        // Check for an invalid address
        if (!address) {
            return false;
        }
        
        let signingAddress = ethers.utils.verifyMessage(message, password);
        let response = basicAuth.safeCompare(signingAddress.toLowerCase(), address.toLowerCase());

        return response;
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