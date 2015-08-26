var api = Object.create(null);
var path = require('path');
var fs = require('fs-extra-promise');
var Q = require('q');
var NodeGit = require('nodegit');
var config = require('./config');
var rest = require('./lib/rest');
var helper = require('./lib/helper');

api.deploy = function (credentials, domainId, appId, sourcePath, message) {

    var tempDir = path.join(__dirname, "temp", appId);

    return fs.existsAsync(tempDir)
        .then(function(tempDirExists){  //cleanup temporary directory
            if(tempDirExists){
                return NodeGit.Repository.open(tempDir)
                    .then(function(repo){
                        return helper.pull(repo)
                        .then(function(){
                            return Q(repo);
                        });
                    });
            } else {
                return helper.cloneOpenShiftRepo(credentials, domainId, appId, tempDir);
            }
        })
        .then(function (repo) { //operate on repository
            return helper.cleanup(tempDir)
                .then(function(){
                    return fs.copyAsync(sourcePath, tempDir, { //copy into newly created repository
                        clobber: true //overwrite existing files
                    });
                })
                .then(function () {
                    return helper.listFiles(tempDir, ['.openshift', '.git']);
                })
                .then(function (files) { //commit all
                    return repo.createCommitOnHead(files, repo.defaultSignature(), repo.defaultSignature(), message);
                })
                .then(function () {
                    return repo.getRemote("origin");
                })
        })
        .then(function(remote){ //push to master
            remote.setCallbacks({
                certificateCheck: function () {
                    return 1;
                },
                credentials: function (url, userName) {
                    return NodeGit.Cred.sshKeyNew(userName, config.key.filename + ".pub", config.key.filename, config.key.password);
                }
            });
            return remote.connect(NodeGit.Enums.DIRECTION.PUSH)
                .then(function(){
                    return remote.push(
                        ["refs/heads/master:refs/heads/master"],
                        null,
                        remote.repo.defaultSignature(),
                        null);
                });
        });
};

module.exports = api;