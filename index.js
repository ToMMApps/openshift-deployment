global.__openShiftDeploymentRoot = __dirname;

var api = Object.create(null);
var path = require('path');
var fs = require('fs-extra-promise');
var Q = require('q');
var config = require('./config');
var rest = require('./lib/rest');
var helper = require('./lib/helper');
var git = require('./lib/git');


/**
 * Deploys the whole folder sourcePath to the given OpenShift app under the given domain.
 * The credentials are used to register this module's ssh key in the given OpenShift account.
 * This is necessary to be able to upload code. The ssh key is generated on npm install.
 * @param {object} credentials Must at least have the properties: user and pass. Those are used as credentials for OpenShift.
 * @param {string} domainId
 * @param {string} appId
 * @param {string} sourcePath
 * @param {string} message
 * @returns {promise}
 */
api.deploy = function (credentials, domainId, appId, sourcePath, message) {



    var tempDir = path.join(process.env.TMPDIR, "openshift-deployment", domainId, appId);

    console.log(tempDir);

    return fs.existsAsync(tempDir)
        .then(function(tempDirExists){  //cleanup temporary directory
            if(tempDirExists){
                return git.Repository.open(tempDir).then(function(repo){
                    return repo.pull("origin", "master").then(function () {
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
                    return repo.addAll();
                })
                .then(function () {
                    return repo.commit(message);
                })
                .then(function () {
                    return repo.push("origin", "master");
                })
        });
};

module.exports = api;