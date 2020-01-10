import UserManager from '../components/userManager';
import Utils from "../components/utils";

class UserController {
    // TODO: Enforce HTTPS

    async get(req, res) {
        let password = req.auth.password;
        let username = Utils._generateUsername(req);
        let user = await UserManager.getByUsername(username, password);

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

    async getPublic(req, res) {
        return res.status(200).send({
            status: "success",
            user: {
                username: process.env.DB_PUBLIC_USER,
                password: process.env.DB_PUBLIC_PASS,
                dsn: UserManager.buildDsn(process.env.DB_PUBLIC_USER, process.env.DB_PUBLIC_PASS)
            }
        });
    }

    async create(req, res) {
        let username = Utils._generateUsername(req);
        let password = req.auth.password;

        // Check user doesn't exist, throw error if found
        let user;
        try {
            let response = await UserManager.create(username, password);
            return UserManager.getByUsername(username, password);
        } catch (err) {
            console.log(err);
        }

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
        let username = Utils._generateUsername(req);
        let databaseName = req.body.databaseName;
        let options = req.body.options ? req.body.options : {};

        let success;
        try {
            success = await UserManager.createDatabase(username, databaseName, options);
        } catch (err) {
            return res.status(400).send({
                status: "fail",
                message: err.error + ": " + err.reason
            });
        }

        if (success) {
            return res.status(200).send({
                status: "success"
            });
        }
        else {
            return res.status(400).send({
                status: "fail",
                message: "Unknown error"
            });
        }
    }

}

const userController = new UserController();
export default userController;