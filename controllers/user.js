import UserManager from '../components/userManager';

class UserController {
    // TODO: Enforce CORS, HTTPS
    // TODO: Configure CouchDB cluster URL, admin credentials
    // TODO: Init admin credentials for a new DB

    async get(req, res) {
        let did = req.auth.user;
        let password = req.auth.password;
        let user = await UserManager.getByDid(did, password);

        if (user) {
            return res.status(200).send({
                status: "success",
                user: user
            });
        }
        else {
            return res.status(400).send({
                status: "fail",
                data: {
                    "did": "Invalid DID specified"
                }
            });
        }
    }

    async create(req, res) {
        let did = req.auth.user;
        let password = req.auth.password;

        // Check user doesn't exist, throw error if found
        let user = await UserManager.create(did, password);

        if (user) {
            return res.status(200).send({
                status: "success",
                user: user
            });
        }
        else {
            return res.status(400).send({
                status: "fail",
                code: 100,
                data: {
                    "did": "User already exists"
                }
            });
        }
    }

    // Grant a user access to a user's database
    async createDatabase(req, res) {
        let did = req.auth.user;
        let databaseName = req.body.databaseName;

        let success = await UserManager.createDatabase(did, databaseName);
        if (success) {
            return res.status(200).send({
                status: "success"
            });
        }
        else {
            return res.status(400).send({
                status: "fail"
            });
        }
    }

}

const userController = new UserController();
export default userController;