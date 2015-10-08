describe('deploy', function(){
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var rest = require('../lib/rest');
    var fs = require('fs-extra-promise');
    var Q = require('q');
    var deploy = require('../index').deploy;
    var helper = require('../lib/helper');
    var path = require('path');
    var git = require('../lib/git');

    var repo = {
        pull: function () {

        },
        addAll: function(){

        },
        commit: function(){

        },
        push: function(){

        }
    };

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it("should be defined", function(){
        expect(deploy).to.be.an('function');
    });

    it("should deploy an existing repo", function(done){
        var credentials = {};
        var sourcePath = "sourcePath";
        var domainId = "domainId";
        var appId = "appId";
        var message = "jdkhfgljk";
        var files = [];
        var expectedTempDir = path.join(process.env.TMPDIR, "openshift-deployment", domainId, appId);

        sandbox.stub(fs, "existsAsync").returns(Q(true));
        sandbox.stub(git.Repository, "open").returns(Q(repo));
        sandbox.stub(repo, "pull").returns(Q());
        sandbox.stub(helper, 'cleanup').returns(Q());
        sandbox.stub(fs, 'copyAsync').returns(Q());
        sandbox.stub(repo, "addAll").returns(Q());
        sandbox.stub(repo, "commit").returns(Q());
        sandbox.stub(repo, "push").returns(Q());

        deploy(credentials, domainId, appId, sourcePath, message).then(function(){
            sinon.assert.calledWithExactly(fs.existsAsync, expectedTempDir);
            sinon.assert.calledWithExactly(git.Repository.open, expectedTempDir);
            sinon.assert.calledWithExactly(repo.pull, "origin", "master");
            sinon.assert.calledOnce(helper.cleanup);
            sinon.assert.calledOnce(fs.copyAsync);
            sinon.assert.calledOnce(repo.addAll);
            sinon.assert.calledWithExactly(repo.commit, message);
            sinon.assert.calledWithExactly(repo.push, "origin", "master");
            done();
        }).catch(console.error);
    });

    it("should clone repo if non-existing", function(done){
        var credentials = {};
        var sourcePath = "sourcePath";
        var domainId = "domainId";
        var appId = "appId";
        var message = "jshgfj,";
        var expectedTempDir = path.join(process.env.TMPDIR, "openshift-deployment", domainId, appId);

        sandbox.stub(helper, "cloneOpenShiftRepo").returns(Q(repo));
        sandbox.stub(fs, "existsAsync").returns(Q(false));
        sandbox.stub(helper, 'cleanup').returns(Q());
        sandbox.stub(fs, 'copyAsync').returns(Q());
        sandbox.stub(repo, "addAll").returns(Q());
        sandbox.stub(repo, "commit").returns(Q());
        sandbox.stub(repo, "push").returns(Q());

        deploy(credentials, domainId, appId, sourcePath, message).then(function(){
            sinon.assert.calledWithExactly(fs.existsAsync, expectedTempDir);
            sinon.assert.calledOnce(helper.cleanup);
            sinon.assert.calledWithExactly(helper.cloneOpenShiftRepo, credentials, domainId, appId, expectedTempDir);
            sinon.assert.calledOnce(fs.copyAsync);
            sinon.assert.calledOnce(repo.addAll);
            sinon.assert.calledWithExactly(repo.commit, message);
            sinon.assert.calledWithExactly(repo.push, "origin", "master");
            done();
        }).catch(console.error);
    });

    it("should overwrite an existing repo if pull fails", function(done){
        var credentials = {};
        var sourcePath = "sourcePath";
        var domainId = "domainId";
        var appId = "appId";
        var message = "jdkhfgljk";
        var files = [];
        var expectedTempDir = path.join(process.env.TMPDIR, "openshift-deployment", domainId, appId);

        sandbox.stub(fs, "existsAsync").returns(Q(true));
        sandbox.stub(git.Repository, "open").returns(Q(repo));
        sandbox.stub(repo, "pull").returns(Q.reject(new Error()));
        sandbox.stub(helper, "cloneOpenShiftRepo").returns(Q(repo));
        sandbox.stub(fs, "removeAsync").returns(Q());
        sandbox.stub(helper, 'cleanup').returns(Q());
        sandbox.stub(fs, 'copyAsync').returns(Q());
        sandbox.stub(repo, "addAll").returns(Q());
        sandbox.stub(repo, "commit").returns(Q());
        sandbox.stub(repo, "push").returns(Q());

        deploy(credentials, domainId, appId, sourcePath, message).then(function(){
            sinon.assert.calledWith(fs.removeAsync, expectedTempDir);
            sinon.assert.calledWithExactly(fs.existsAsync, expectedTempDir);
            sinon.assert.calledWithExactly(git.Repository.open, expectedTempDir);
            sinon.assert.calledWithExactly(helper.cloneOpenShiftRepo, credentials, domainId, appId, expectedTempDir);
            sinon.assert.calledWithExactly(repo.pull, "origin", "master");
            sinon.assert.calledOnce(helper.cleanup);
            sinon.assert.calledOnce(fs.copyAsync);
            sinon.assert.calledOnce(repo.addAll);
            sinon.assert.calledWithExactly(repo.commit, message);
            sinon.assert.calledWithExactly(repo.push, "origin", "master");
            done();
        }).catch(console.error);
    });
});