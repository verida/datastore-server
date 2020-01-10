const CouchDb = require('nano');

class UserManager {

    constructor() {
        this.error = null;
    }

    /**
     * Get a user by DID
     * 
     * @param {} did 
     */
    async getByUsername(username, password) {
        let couch = this._getCouch();
        let usersDb = couch.db.use('_users');

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

    async create(username, password) {
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
            return await usersDb.insert(userData);
        } catch (err) {
            this.error = err;
            console.log(err);
            return false;
        }
    }

    async createDatabase(username, databaseName, options) {
        let couch = this._getCouch();

        let response;
        // Create database
        try {
            response = await couch.db.create(databaseName);
        } catch (err) {
            //console.error("Database existed: "+databaseName);
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

    /**
     * Ensure we have a public user in the database for accessing public data
     */
    async ensurePublicUser() {
        let user = process.env.DB_PUBLIC_USER;
        let pass = process.env.DB_PUBLIC_PASS;
        return await this.create(user,pass);
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