var path = require('path');
var fs = require('fs-extra-promise');
var Q = require('q');
var NodeGit = require('nodegit');
var walk = require('walk');
var config = require('./../config');
var rest = require('./rest');

var privateKeyFilename = path.join(path.resolve(__dirname + "/../"), config.key.filename);
var publicKeyFilename = privateKeyFilename + ".pub";

/**
 * Removes all files and subdirectories in the given directory except for .git and .openshift.
 * @param {string} root
 */
module.exports.cleanup = function(root){
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
};

/**
 * Retrieves the git_url of the given appId and transforms this git_url, so that it can be cloned with NodeGit.
 * @param {object} credentials
 * @param {string} domainId
 * @param appId
 * @returns {promise} resolves to the transformed git_url
 */
module.exports.transformUrl = function(credentials, domainId, appId){
    return rest.application.info(credentials, domainId, appId)
        .then(function(appInfo){
            var git_url = appInfo.git_url;
            var replaceString = "var/lib/openshift/" + appInfo.uuid;
            return Q(git_url.replace("~", replaceString));
        });
};

/**
 * Clones the given application to the given path.
 * @param {object} credentials
 * @param {string} domainId
 * @param {string} appId
 * @param {string} path
 * @returns {promise} resolves with the result of NodeGit.Clone
 */
module.exports.cloneOpenShiftRepo = function(credentials, domainId, appId, path){
    return Q.all([
        module.exports.transformUrl(credentials, domainId, appId),
        rest.ssh.update(credentials)
    ]).spread(function (url) {
        return NodeGit.Clone(url, path, {
            remoteCallbacks: {
                certificateCheck: function () {
                    return 1;
                },
                credentials: function (url, userName) {
                    return NodeGit.Cred.sshKeyNew(userName, publicKeyFilename, privateKeyFilename, config.key.password);
                }
            }
        });
    });
};

/**
 * Pulls all changes from the master branch.
 * @param {NodeGit.Repository} repo
 */
module.exports.pull = function(repo){
    return repo.fetchAll({
        certificateCheck: function () {
            return 1;
        },
        credentials: function (url, userName) {
            return NodeGit.Cred.sshKeyNew(userName, publicKeyFilename, privateKeyFilename, config.key.password);
        }
    })
        .then(function(){
            return repo.mergeBranches("master", "origin/master");
        });
};

/**
 * Creates a list of all files in a given directory and subdirectories.
 * @param {string} root
 * @param {array} filters
 * @returns {promise} resolves with an array of files
 */
module.exports.listFiles = function(root, filters){
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
};