describe('deploy', function(){
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var rest = require('../lib/rest');
    var fs = require('fs-extra-promise');
    var Q = require('q');
    var deploy = require('../index').deploy;
    var NodeGit = require('nodegit');
    var Repository = NodeGit.Repository;
    var helper = require('../lib/helper');
    var Cred = NodeGit.Cred;
    var path = require('path');

    var repo = {
        fetchAll: function(){
            return Q();
        },
        mergeBranches: function(){
            return Q();
        },
        createCommitOnHead: function(){
            return Q();
        },
        getRemote: function(){
            return Q();
        },
        defaultSignature: function(){
            return Q();
        }
    };

    var remote = {
        setCallbacks: function(){
            return Q();
        },
        connect: function(){
            return Q();
        },
        push: function(){
            return Q();
        },
        repo: repo
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
        var files = [];
        var expectedTempDir = path.join(process.env.TMPDIR, domainId, appId);

        sandbox.stub(fs, "existsAsync").returns(Q(true));
        sandbox.stub(Repository, "open").returns(Q(repo));
        sandbox.stub(repo, "createCommitOnHead").returns(Q());
        sandbox.stub(repo, "getRemote").returns(Q(remote));
        sandbox.stub(helper, 'pull').returns(Q());
        sandbox.stub(helper, 'cleanup').returns(Q());
        sandbox.stub(helper, 'listFiles').returns(Q());
        sandbox.stub(fs, 'copyAsync').returns(Q(files));
        sandbox.stub(remote, "setCallbacks").returns(Q());
        sandbox.stub(remote, "connect").returns(Q());
        sandbox.stub(remote, "push").returns(Q());
        sandbox.stub(Cred, 'sshKeyNew').returns(Q());

        deploy(credentials, domainId, appId).then(function(){
            sinon.assert.calledWithExactly(fs.existsAsync, expectedTempDir);
            sinon.assert.calledOnce(fs.existsAsync, expectedTempDir);
            sinon.assert.calledWithExactly(Repository.open, expectedTempDir);
            sinon.assert.calledWithExactly(helper.pull, repo);
            sinon.assert.calledOnce(helper.cleanup);
            sinon.assert.calledOnce(fs.copyAsync);
            sinon.assert.calledOnce(helper.listFiles);
            sinon.assert.calledOnce(repo.createCommitOnHead);
            sinon.assert.calledWithExactly(repo.getRemote, 'origin');
            sinon.assert.calledOnce(remote.setCallbacks);
            sinon.assert.calledWithExactly(remote.connect, NodeGit.Enums.DIRECTION.PUSH);
            sinon.assert.calledOnce(remote.push);
            sinon.assert.callOrder(
                fs.existsAsync,
                Repository.open,
                helper.pull,
                helper.cleanup,
                fs.copyAsync,
                helper.listFiles,
                repo.createCommitOnHead,
                repo.getRemote,
                remote.setCallbacks,
                remote.connect,
                remote.push
            );
            done();
        }).catch(console.error);
    });

    it("should clone repo if non-existing", function(done){
        var credentials = {};
        var sourcePath = "sourcePath";
        var domainId = "domainId";
        var appId = "appId";
        var files = [];

        sandbox.stub(fs, "existsAsync").returns(Q(false));
        sandbox.stub(repo, "createCommitOnHead").returns(Q());
        sandbox.stub(repo, "getRemote").returns(Q(remote));
        sandbox.stub(helper, 'cloneOpenShiftRepo').returns(Q(repo));
        sandbox.stub(helper, 'cleanup').returns(Q());
        sandbox.stub(helper, 'listFiles').returns(Q());
        sandbox.stub(fs, 'copyAsync').returns(Q(files));
        sandbox.stub(remote, "setCallbacks").returns(Q());
        sandbox.stub(remote, "connect").returns(Q());
        sandbox.stub(remote, "push").returns(Q());
        sandbox.stub(Cred, 'sshKeyNew').returns(Q());

        deploy(credentials, domainId, appId).then(function(){
            sinon.assert.calledOnce(fs.existsAsync);
            sinon.assert.calledOnce(helper.cloneOpenShiftRepo);
            sinon.assert.calledOnce(helper.cleanup);
            sinon.assert.calledOnce(fs.copyAsync);
            sinon.assert.calledOnce(helper.listFiles);
            sinon.assert.calledOnce(repo.createCommitOnHead);
            sinon.assert.calledWithExactly(repo.getRemote, 'origin');
            sinon.assert.calledOnce(remote.setCallbacks);
            sinon.assert.calledWithExactly(remote.connect, NodeGit.Enums.DIRECTION.PUSH);
            sinon.assert.calledOnce(remote.push);
            done();
        }).catch(console.error);
    });
});