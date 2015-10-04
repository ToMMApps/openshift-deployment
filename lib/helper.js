var path = require('path');
var fs = require('fs-extra-promise');
var Q = require('q');
var git = require('./git');
var config = require('./../config');
var rest = require('./rest');

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
 * Clones the given application to the given path.
 * @param {object} credentials
 * @param {string} domainId
 * @param {string} appId
 * @param {string} path
 * @returns {promise} resolves with the result of NodeGit.Clone
 */
module.exports.cloneOpenShiftRepo = function(credentials, domainId, appId, path){
    return Q.all([
        rest.application.info(credentials, domainId, appId),
        rest.ssh.update(credentials)
    ]).spread(function (appInfo) {
        return git.clone(appInfo.git_url, path);
    });
};
