var rp = require('request-promise');
var Q = require('q');
var fs = require('fs-extra-promise');
var config = require('./../config');
var path = require('path');

var api = Object.create(null);

/**
 * Transforms root dir publicKey to OpenShift format
 */
function transformPublicKey(){
    return fs.readFileAsync(config.key.filename + ".pub")
        .then(function(publicKey){
            var splittedPublicKey = publicKey.toString().split(' ');

            return Q({
                name: config.key.name,
                type: splittedPublicKey[0],
                content: splittedPublicKey[1]
            });
        });
}

/**
 * Retrieve list of server-side ssh keys
 * @param {object} credentials user and pass
 */
api.list = function(credentials){
    return rp.get('https://openshift.redhat.com/broker/rest/user/keys', {
        headers: {
            accept: '*/*'
        },
        auth: credentials,
        transform: JSON.parse
    })
    .then(function(response){
        return Q(response.data);
    });
};

/**
 * Get ssh key with specific name
 * @param {object} credentials user and pass
 * @param {string} name
 */
api.get = function(credentials, name){
    return rp.get('https://openshift.redhat.com/broker/rest/user/keys/' + name, {
        headers: {
            accept: '*/*'
        },
        auth: credentials,
        transform: JSON.parse
    })
        .then(function(response){
            return Q(response.data);
        });
};

/**
 * Update ssh key on server
 * Deletes an existing ssh key with the same name but different content
 * @param {object} publicKey name, type and content; defaults to key in root dir
 * @param {object} credentials user and pass
 */
api.update = function(credentials, publicKey){
    var promises = [
        api.get(credentials, config.key.name),
        publicKey? Q(publicKey) : transformPublicKey()
    ];

    return Q.allSettled(promises)
        .spread(function(serverSideKey, clientSideKey){

            if(serverSideKey.state === 'rejected'){
                if(serverSideKey.reason.statusCode === 404){
                    return api.upload(credentials);
                } else {
                    return Q.reject(serverSideKey.reason);
                }
            } else if(
                serverSideKey.value.type !== clientSideKey.value.type ||
                serverSideKey.value.content !== clientSideKey.value.content
            ){
                return api.delete(credentials)
                    .then(function(){
                        return api.upload(credentials);
                    });
            } else {
                return Q(clientSideKey.value);
            }
        });
};

/**
 * Upload ssh key
 * Ignores any errors
 * @param {object} publicKey name, type and content; defaults to key in root dir
 * @param {object} credentials user and pass
 */
api.upload = function(credentials, publicKey){
    return (publicKey? Q(publicKey) : transformPublicKey())
        .then(function(transformedKey){

            return rp.post('https://openshift.redhat.com/broker/rest/user/keys', {
                headers: {
                    accept: '*/*'
                },
                form: transformedKey,
                auth: credentials
            });
        });
};

/**
 * Delete ssh key
 * @param {object} credentials user and pass
 * @param {string} name defaults to name of key in root dir
 */
api.delete = function(credentials, name){
    if(!name) name = config.key.name;

    return rp.del('https://openshift.redhat.com/broker/rest/user/keys/' + name, {
        headers: {
            accept: '*/*'
        },
        auth: credentials
    });
};

module.exports = api;