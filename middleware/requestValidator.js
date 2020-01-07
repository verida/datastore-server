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
        let message = "\""+applicationName+"\" (" + req.hostname +") is requesting access to " + did;

        let address = false;
        let matches = did.match(/(0x[a-z0-9]*)/);
        if (matches.length >1) {
            address = matches[1].toUpperCase();
        }

        // Check for an invalid address
        if (!address) {
            return false;
        }
        
        let signingAddress = ethers.utils.verifyMessage(message, password);
        return basicAuth.safeCompare(signingAddress, address);
    }

}

let requestValidator = new RequestValidator();
export default requestValidator;