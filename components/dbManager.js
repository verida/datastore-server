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

        let owner = username;
        let writeUsers = [owner];
        let readUsers = [owner];

        switch (permissions.write) {
            case "user":
                writeUsers = writeUsers.concat(permissions.writeList);
                break;
            case "public":
                writeUsers = writeUsers.concat([process.env.DB_PUBLIC_USER]);
                break;
        }

        switch (permissions.read) {
            case "user":
                readUsers = readUsers.concat(permissions.readList);
                break;
            case "public":
                readUsers = readUsers.concat([process.env.DB_PUBLIC_USER]);
                break;
        }

        let dbMembers = readUsers.concat(writeUsers);

        let securityDoc = {
            admins: {
                names: [owner],
                roles: []
            },
            members: {
                names: dbMembers,
                roles: []
            }
        };

        // TODO: Support updating the list of valid users

        // Create validation document so only owner users in the write list can write to the database
        let writeUsersJson = JSON.stringify(writeUsers);
        await db.insert({
            "validate_doc_update": "\n    function(newDoc, oldDoc, userCtx, secObj) {\n        if ("+writeUsersJson+".indexOf(userCtx.name) == -1) throw({ unauthorized: 'User is not permitted to write to database' });\n}"
        }, "_design/only_permit_write_users");

        // Insert security document to ensure owner is the admin and any other read / write users can access the database
        await db.insert(securityDoc, "_security");

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