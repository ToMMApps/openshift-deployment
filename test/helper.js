describe('helper', function() {
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var helper = require('../lib/helper');
    var fs = require('fs-extra-promise');
    var Q = require('q');
    var rest = require('./../lib/rest');
    var walk = require('walk');
    var mockFs = require('mock-fs');
    var git = require('../lib/git');

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


    describe("cloneOpenShiftRepo", function(){
        it("should be defined", function(){
            expect(helper.cloneOpenShiftRepo).to.be.an('function');
        });

        it("should call NodeGit.Clone with the correct parameters", function(done){
            var domainId = "MyDomain";
            var appId = "MyApp";
            var path = "path";
            var appInfo = {
                git_url: "url..."
            };

            var credentials = {
                user: "user",
                pass: "pass"
            };

            sandbox.stub(rest.application, "info").returns(Q(appInfo));
            sandbox.stub(rest.ssh, "update").returns(Q());
            sandbox.stub(git, "clone").returns(Q());

            helper.cloneOpenShiftRepo(credentials, domainId, appId, path).then(function(){
                sinon.assert.calledWithExactly(rest.ssh.update, credentials);
                sinon.assert.calledWithExactly(rest.application.info, credentials, domainId, appId);
                sinon.assert.calledWithExactly(git.clone, appInfo.git_url, path);
                done();
            }).catch(console.error);
        });
    });
});