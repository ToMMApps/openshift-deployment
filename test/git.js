describe('git', function(){
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var rest = require('../lib/rest');
    var fs = require('fs-extra-promise');
    var Q = require('q');
    var helper = require('../lib/helper');
    var git = require('../lib/git');
    var childProcessPromise = require('child-process-promise');

    global.__openShiftDeploymentRoot = "/";
    var filename = require('../config').key.filename;


    var sandbox, url, path, repo, message;


    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(childProcessPromise, "exec").returns(Q());

        url = "https://github.com/ToMMApps/openshift-deployment";
        path = "temp";
        repo = new git.Repository(path);
        message = "Test Message";
    });

    afterEach(function () {
        sandbox.restore();
    });

    it("should define clone", function () {
        expect(git.clone).to.be.an('function');
    });

    it("should define Repository", function(){
        expect(git.Repository).to.be.an('function');
        expect(git.Repository.open).to.be.an('function');
        expect(git.Repository.prototype.pull).to.be.an('function');
        expect(git.Repository.prototype.addAll).to.be.an('function');
        expect(git.Repository.prototype.commit).to.be.an('function');
        expect(git.Repository.prototype.push).to.be.an('function');
    });

    describe("clone", function () {
        it("should call clone with correct params", function (done) {

            git.clone(url, path).then(function (repo) {
                sinon.assert.calledWith(childProcessPromise.exec, "/git.sh -i /openshift_rsa clone " + url + " " + path);
                expect(repo.path).to.equal(path);
                done();
            });
        });
    });

    describe("Repository", function(){
        describe("open", function () {
            it("should create a new Repository object", function (done) {
                git.Repository.open(path).then(function (newRepo) {
                    expect(newRepo.path).to.equal(path);
                    expect(newRepo).not.to.be(repo);
                    done();
                });
            });
        });
        
        describe("pull", function () {
            it("should call pull with correct params", function (done) {

                repo.pull("origin", "master").then(function () {
                    sinon.assert.calledWith(childProcessPromise.exec, "/git.sh -i /openshift_rsa pull origin master");
                    done();
                }).catch(console.error);
            });
        });

        describe("commit", function () {
            it("should call commit with correct params", function (done) {

                repo.commit(message).then(function () {
                    sinon.assert.calledWith(childProcessPromise.exec, "git commit -m " + message, {cwd: path});
                    done();
                }).catch(console.error);
            });
        });

        describe("addAll", function () {
            it("should call add with correct params", function (done) {

                repo.addAll().then(function () {
                    sinon.assert.calledWith(childProcessPromise.exec, "git add -A", {cwd: path});
                    done();
                }).catch(console.error);
            });
        });

        describe("push", function () {
            it("should call push with correct params", function (done) {

                repo.push("origin", "master").then(function () {
                    sinon.assert.calledWith(childProcessPromise.exec, "/git.sh -i /openshift_rsa push origin master", {cwd: path});
                    done();
                }).catch(console.error);
            });
        });
    });
});