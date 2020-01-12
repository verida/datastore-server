var assert = require("assert");
require('dotenv').config();

//import DbManager from "../components/dbManager";
import UserManager from "../components/userManager";

describe("Permissions", function() {
    let ownerUser, userUser, publicUser;

    this.beforeAll(async function() {
        // The "owner" of a database
        UserManager.create("test-owner", "test-owner");
        ownerUser = await UserManager.getByUsername("test-owner", "test-owner");

        // Another user that isn't an "owner"
        UserManager.create("test-user", "test-user");
        userUser = await UserManager.getByUsername("test-user", "test-owner");

        // A public user
        UserManager.create(process.env.DB_PUBLIC_USER, process.env.DB_PUBLIC_PASS);
        publicUser = await UserManager.getByUsername("process.env.DB_PUBLIC_USER", process.env.DB_PUBLIC_PASS);
    });

    describe("Owner:Read", function() {
        it("should run a test okay", function() {
            assert.equal(1,1);
            console.log(ownerUser);
        });
    });

    this.afterAll(async function() {
        // TODO: delete owner, user, but leave public
    })
});