
const crypto = require('crypto');

class Utils {

    _generateUsername(req) {
        let did = req.auth.user;
        let applicationName = req.headers['application-name'];
        let hash = crypto.createHmac('sha1', process.env.HASH_KEY);
        hash.update(did + "/" + applicationName);

        // Username must start with a letter
        return "v" + hash.digest('hex');
    }

}

let utils = new Utils();
export default utils;