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

    

    /**
     * Ensure we have a public user in the database for accessing public data
     */
    async ensurePublicUser() {
        let username = process.env.DB_PUBLIC_USER;
        let password = process.env.DB_PUBLIC_PASS;

        let couch = this._getCouch();

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
            await usersDb.insert(userData);
            console.log("Public user created");
        } catch (err) {
            console.log("Public user not created -- already existed");
        }
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