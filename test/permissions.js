var assert = require("assert");
require('dotenv').config();

import DbManager from "../components/dbManager";
import UserManager from "../components/userManager";
import expressBasicAuth from "express-basic-auth";
const CouchDb = require('nano');

describe("Permissions", function() {
    var ownerUser, userUser, publicUser;
    var ownerDb, userDb, publicDb;
    var testDbName = "testdb";

    this.beforeAll(async function() {
        // The "owner" of a database
        UserManager.create("test-owner", "test-owner");
        ownerUser = await UserManager.getByUsername("test-owner", "test-owner");

        // Another user that isn't an "owner"
        UserManager.create("test-user", "test-user");
        userUser = await UserManager.getByUsername("test-user", "test-user");

        // A public user
        UserManager.create(process.env.DB_PUBLIC_USER, process.env.DB_PUBLIC_PASS);
        publicUser = await UserManager.getByUsername(process.env.DB_PUBLIC_USER, process.env.DB_PUBLIC_PASS);
    });

    describe("Owner (Read and Write)", async function() {

        this.beforeAll(async function() {
            // Create test database where only owner can read and write
            await DbManager.createDatabase(ownerUser.username, testDbName, {
                permissions: {
                    write: "owner",
                    read: "owner"
                }
            });

            let couchDb = new CouchDb(ownerUser.dsn);
            ownerDb = couchDb.use(testDbName);

            couchDb = new CouchDb(userUser.dsn);
            userDb = couchDb.use(testDbName);

            couchDb = new CouchDb(publicUser.dsn);
            publicDb = couchDb.use(testDbName);
        })
        
        it("should allow owner to write data", async function() {
            // Write a test record
            let response = await ownerDb.insert({
                "_id": "owner-read-write",
                "hello": "world"
            });

            assert.equal(response.ok, true);
        });
        it("shouldn't allow user write data", async function() {
            // Write a test record that fails
            await assert.rejects(userDb.insert({
                "_id": "user-read-write",
                "hello": "world"
            }), {
                name: "Error",
                reason: "You are not allowed to access this db."
            });
        });
        it("shouldn't allow public to write data", async function() {
            // Write a test record that fails
            await assert.rejects(publicDb.insert({
                "_id": "public-read-write",
                "hello": "world"
            }), {
                name: "Error",
                reason: "You are not allowed to access this db."
            });
        });
        it("should allow owner to read data", async function() {
            let doc = await ownerDb.get("owner-read-write");
            assert.equal(doc._id, "owner-read-write");
        });
        it("shouldn't allow user to read data", async function() {
            await assert.rejects(userDb.get("owner-read-write"), {
                name: "Error",
                reason: "You are not allowed to access this db."
            });
        });
        it("shouldn't allow public to read data", async function() {
            await assert.rejects(publicDb.get("owner-read-write"), {
                name: "Error",
                reason: "You are not allowed to access this db."
            });
        });
        

        this.afterAll(async function() {
            // Delete test database
            let response = await DbManager.deleteDatabase(testDbName);
        });
    });

    after(async function() {
        // TODO: delete owner, user, but leave public
    })
});