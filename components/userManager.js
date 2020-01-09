const CouchDb = require('nano');
const crypto = require('crypto');

class UserManager {

    constructor() {
        this.error = null;
    }

    /**
     * Get a user by DID
     * 
     * @param {} did 
     */
    async getByDid(did, password) {
        let couch = this._getCouch();
        let usersDb = couch.db.use('_users');
        let username = this.generateUsername(did);

        try {
            let response = await usersDb.get('org.couchdb.user:' + username);
            return {
                username: username,
                dsn: this.buildDsn(username, password),
                salt: response.salt
            };
        } catch (err) {
            this.error = err;
            return false;
        }
    }

    async create(did, password) {
        let username = this.generateUsername(did);
        let couch = this._getCouch();

        // Create keyring
        let keyRing = {"key": "ring"};

        // Create CouchDB database user matching username and password and save keyring
        let userData = {
            _id: "org.couchdb.user:" + username,
            name: username,
            password: password,
            type: "user",
            roles: []
        };

        let usersDb = couch.db.use('_users');
        try {
            let response = await usersDb.insert(userData);
            return this.getByDid(did, password);
        } catch (err) {
            this.error = err;
            return false;
        }
    }

    async createDatabase(did, databaseName, options) {
        let username = this.generateUsername(did);
        let couch = this._getCouch();

        let response;
        // Create database
        try {
            response = await couch.db.create(databaseName);
        } catch (err) {
            // The database may already exist, or may have been deleted so a file
            // already exists.
            // In that case, ignore the error and continue
        }

        let db = couch.db.use(databaseName);
        if (options.publicWrite !== true) {
            // Create security document so user is the only admin
            let securityDoc = {
                admins: {
                    names: [username],
                    roles: []
                },
                members: {
                    names: [],
                    roles: []
                }
            };
            
            response = await db.insert(securityDoc, "_security");
        }

        // Create validation document so only user can update their own `_user` record
        response = await db.insert({
            "validate_doc_update": "\n    function(newDoc, oldDoc, userCtx, secObj) {\n        if (userCtx.name != \""+username+"\") throw({ unauthorized: 'User is not owner' });\n}"
        }, "_design/only_permit_owner");

        return true;
    }

    generateUsername(did) {
        let hash = crypto.createHmac('sha1', process.env.HASH_KEY);
        hash.update(did);

        // Username must start with a letter
        return "v" + hash.digest('hex');
    }

    _getCouch() {
        let dsn = this.buildDsn(process.env.DB_USER, process.env.DB_PASS);

        if (!this._couch) {
            this._couch = new CouchDb(dsn);
        }

        return this._couch;
    }

    buildDsn(username, password) {
        let env = process.env;
        return env.DB_PROTOCOL + "://" + username + ":" + password + "@" + env.DB_HOST + ":" + env.DB_PORT;
    }

}

let userManager = new UserManager();
export default userManager;