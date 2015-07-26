var api = Object.create(null);
var path = require('path');
var fs = require('fs-extra-promise');
var Q = require('q');
var NodeGit = require('nodegit');
var walk = require('walk');
var config = require('./config');
var rest = require('./rest');

function transformUrl(appId, credentials){
    return rest.application.info(appId, credentials)
        .then(function(appInfo){
            var git_url = appInfo.git_url;
            var replaceString = "var/lib/openshift/" + appId;
            return Q(git_url.replace("~", replaceString));
        });
}

function cloneOpenShiftRepo(appId, credentials, path) {
    return Q.all([
        transformUrl(appId, credentials),
        rest.ssh.update(credentials)
    ]).spread(function (url) {
        return NodeGit.Clone(url, path, {
            remoteCallbacks: {
                certificateCheck: function () {
                    return 1;
                },
                credentials: function (url, userName) {
                    return NodeGit.Cred.sshKeyNew(userName, config.key.filename + ".pub", config.key.filename, config.key.password);
                }
            }
        });
    });
}

function pull(repo){
    return repo.fetchAll({
        certificateCheck: function () {
            return 1;
        },
        credentials: function (url, userName) {
            return NodeGit.Cred.sshKeyNew(userName, config.key.filename + ".pub", config.key.filename, config.key.password);
        }
    })
        .then(function(){
            return repo.mergeBranches("master", "origin/master");
        });
}


function listFiles(root, filters){
    if(!filters) filters = [];

    var deferred = Q.defer();
    var walker  = walk.walk(root, {
        followLinks: false,
        filters: filters
    });
    var files = [];

    walker.on('file', function(root, stat, next) {
        files.push(path.join(root, stat.name));
        next();
    });

    walker.on('end', function() {
        deferred.resolve(files);
    });

    return deferred.promise;
}

function cleanup(root){
    return fs.readdirAsync(root)
        .then(function(files){
            files = files.filter(function(file){
                return ['.git', '.openshift'].indexOf(file) === -1;
            });

            var promises = files.map(function(file){
               return fs.removeAsync(path.join(root, file));
            });

            return Q.all(promises);
        });
}

/**
 *
 * @param sourcePath
 * @param credentials
 * @param appId
 * @param message
 */
api.deploy = function (sourcePath, credentials, appId, message) {

    var tempDir = path.join(__dirname, "temp", appId);

    return fs.existsAsync(tempDir)
        .then(function(tempDirExists){  //cleanup temporary directory
            if(tempDirExists){
                return NodeGit.Repository.open(tempDir)
                    .then(function(repo){
                        return pull(repo)
                        .then(function(){
                            return Q(repo);
                        });
                    });
            } else {
                return cloneOpenShiftRepo(appId, credentials, tempDir);
            }
        })
        .then(function (repo) { //operate on repository
            return cleanup(tempDir)
                .then(function(){
                    return fs.copyAsync(sourcePath, tempDir, { //copy into newly created repository
                        clobber: true //overwrite existing files
                    });
                })
                .then(function () {
                    return listFiles(tempDir, ['.openshift', '.git']);
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