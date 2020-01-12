const CouchDb = require('nano');

class DbManager {

    constructor() {
        this.error = null;
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

        return this.configurePermissions(db, username, options.permissions);
    }

    async deleteDatabase(databaseName) {
        let couch = this._getCouch();

        let response;
        // Create database
        try {
            return await couch.db.destroy(databaseName);
        } catch (err) {
            //console.error("Database existed: "+databaseName);
            // The database may already exist, or may have been deleted so a file
            // already exists.
            // In that case, ignore the error and continue
        }
    }

    async configurePermissions(db, username, permissions) {
        permissions = permissions ? permissions : {};

        let securityDoc = {
            admins: {
                names: [],
                roles: []
            },
            members: {
                names: [],
                roles: []
            }
        };
        let addSecurityDoc = false;

        let response;

        if (permissions.write == "owner") {
            // Set owner as admin
            securityDoc.admins.names = [username];
            addSecurityDoc = true;

            // Create validation document so only user can update their own `_user` record
            response = await db.insert({
                "validate_doc_update": "\n    function(newDoc, oldDoc, userCtx, secObj) {\n        if (userCtx.name != \""+username+"\") throw({ unauthorized: 'User is not owner' });\n}"
            }, "_design/only_permit_owner");
        }

        if (permissions.read == "owner") {
            // Set public user as a member so they are the only users who can read the database
            securityDoc.members.names = [username];
            addSecurityDoc = true;
        }

        if (addSecurityDoc) {
            response = await db.insert(securityDoc, "_security");
        }

        return true;
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

let dbManager = new DbManager();
export default dbManager;