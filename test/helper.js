describe('helper', function() {
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var helper = require('../lib/helper');
    var fs = require('fs-extra-promise');
    var Q = require('q');
    var rest = require('./../lib/rest');
    var NodeGit = require('nodegit');
    var walk = require('walk');
    var mockFs = require('mock-fs');

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
        mockFs.restore();
    });

    describe("cleanup", function(){
        it("should be defined", function(){
            expect(helper.cleanup).to.be.an('function');
        });

        it("should call removeAsync", function(done){
            var files = [".git", ".openshift", "file"];
            var root = "root";

            sandbox.stub(fs, "readdirAsync").returns(Q(files));
            sandbox.stub(fs, "removeAsync").returns(Q(files));

            helper.cleanup(root).then(function(){
                sinon.assert.calledWithExactly(fs.readdirAsync, root);
                sinon.assert.callCount(fs.removeAsync, 1);
                sinon.assert.calledWithExactly(fs.removeAsync, "root/file");
                done();
            }).catch(console.error);
        });
    });

    describe("transformUrl", function(){
        it("should be defined", function(){
            expect(helper.transformUrl).to.be.an('function');
        });

        it("should return the correct url", function(done){

            var domainId = "MyDomain";
            var appId = "MyApp";

            var credentials = {
                user: "user",
                pass: "pass"
            };

            var expectedGitUrl = "ssh://dfd34495f6ab404e819d2f74ebd4cb50@myapp-MyDomain.rhcloud.com/var/lib/openshift/MyApp/git/myapp.git/"

            var exampleAppInfo = {
                "aliases": [],
                "app_url": "http://myapp-MyDomain.rhcloud.com/",
                "build_job_url": null,
                "building_app": null,
                "building_with": null,
                "creation_time": "2012-10-18T23:44:21Z",
                "domain_id": domainId,
                "embedded": {
                    "haproxy-1.4": {},
                    "mysql-5.1": {
                        "connection_url": "mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/",
                        "database_name": "myapp",
                        "password": "zF2MfdIdGdMk",
                        "username": "admin",
                        "info": "Connection URL: mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/"
                    }
                },
                "framework": "php-5.3",
                "gear_count": 2,
                "gear_profile": "small",
                "git_url": "ssh://dfd34495f6ab404e819d2f74ebd4cb50@myapp-MyDomain.rhcloud.com/~/git/myapp.git/",
                "health_check_path": "health_check.php",
                "initial_git_url": "",
                "name": "myapp",
                "scalable": true,
                "ssh_url": "ssh://dfd34495f6ab404e819d2f74ebd4cb50@myapp-MyDomain.rhcloud.com",
                "uuid": "dfd34495f6ab404e819d2f74ebd4cb50"
            };

            sandbox.stub(rest.application, "info").returns(Q(exampleAppInfo));

            helper.transformUrl(credentials, domainId, appId).then(function(git_url){
                expect(git_url).to.equal(expectedGitUrl);
                sinon.assert.calledWithExactly(rest.application.info, credentials, domainId, appId);
                done();
            }).catch(console.error);
        });
    });

    describe("cloneOpenShiftRepo", function(){
        it("should be defined", function(){
            expect(helper.cloneOpenShiftRepo).to.be.an('function');
        });

        it("should call NodeGit.Clone with the correct parameters", function(done){
            var domainId = "MyDomain";
            var appId = "MyApp";
            var url = "git_url";
            var path = "path";

            var credentials = {
                user: "user",
                pass: "pass"
            };

            sandbox.stub(helper, "transformUrl").returns(Q(url));
            sandbox.stub(rest.ssh, "update").returns(Q());
            sandbox.stub(NodeGit, "Clone").returns(Q());
            sandbox.stub(NodeGit.Cred, "sshKeyNew");

            helper.cloneOpenShiftRepo(credentials, domainId, appId, path).then(function(){
                sinon.assert.calledWithExactly(helper.transformUrl, credentials, domainId, appId);
                sinon.assert.calledWithExactly(rest.ssh.update, credentials);
                sinon.assert.calledWith(NodeGit.Clone, url, path);
                done();
            }).catch(console.error);
        });
    });

    describe("pull", function(){
        it("should be defined", function(){
            expect(helper.pull).to.be.an('function');
        });

        it("should call mergeBranches", function(done){

            var repo = {
                fetchAll: function(){},
                mergeBranches: function(){}
            };

            sandbox.stub(repo, "fetchAll").returns(Q());
            sandbox.stub(repo, "mergeBranches").returns(Q());

            helper.pull(repo).then(function(){
                sinon.assert.calledOnce(repo.fetchAll);
                sinon.assert.calledWithExactly(repo.mergeBranches, "master", "origin/master");
                done();
            }).catch(console.error);
        });
    });

    describe("listFiles", function(){
        it("should be defined", function(){
            expect(helper.listFiles).to.be.an('function');
        });

        it("should return a list of files", function(done){

            var expectedFiles = ["root/file", "root/subDir/file"];
            var filter = ["git"];

            mockFs({
                'root': {
                    'file': '',
                    'subDir': {
                        'file': ''
                    },
                    'git': {

                    }
                }
            });

            helper.listFiles('root', filter).then(function(files, filter){
                expect(files).to.eql(expectedFiles);
                done();
            }).catch(console.error);
        });
    });
});