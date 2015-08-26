describe('rest', function(){
    var expect = require("expect.js");
    var nock = require('nock');
    var sinon = require('sinon');
    var config = require('../config');
    var rest = require('../rest');
    var fs = require('fs-extra-promise');
    var Q = require('q');

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('index', function(){
        it('should define application', function () {
            expect(rest.application).to.be.an('object');
        });

        it("should define ssh", function(){
            expect(rest.ssh).to.be.an('object');
        })
    });

    describe('ssh', function(){
        var ssh = require('../rest/ssh');
        var keys = nock('https://openshift.redhat.com/broker/rest/user/keys', {
            reqheaders: {
                'authorization': 'Basic dXNlcjpwYXNz',
                accept: '*/*'
            }
        });
        var credentials = {
            user: "user",
            pass: "pass"
        };
        var processedSSHKey = {
            "content": "AAAAB3NzaC1yc2EAAAABIwAAAQEA14PDPWsaZMDspZNK7ABsppzwy++Ih2tRwjBkxzC2KEcQi7v8IcyODb7qLJ72tgx3G90zRm7vQ6wuyy7rkYLIvTYiDncI4THYUsve7wuBuSCgFcHLUdon7xn7VrskjhMN4git6bjaY1+o4Knpfm3N72+9q/6+T52QIWCE1+Ku6UYYuOGy8qTgoijy24bp4jGEKAXqTXcALuBoukC3uB+xujhZYH1fbek6aEAQPYzO6sGqJqV1UoF0ascelzMbDJA4XOrKPr/5uJsPS+kGZguU16ykQb2k9K03TYHfvPP4rLe50Q9G4dSZFbUOQXdC3n13CuioEVzizUGl0HyT8MhRqw==",
            "name": config.key.name,
            "type": "ssh-rsa"
        };
        var differentProcessedSSHKey = {
            "content": "BBBAB3NzaC1yc2EAAAABIwAAAQEA14PDPWsaZMDspZNK7ABsppzwy++Ig4RwjBkxzC2KEcQi7v8IcyODb7qLJ72tgx3G90zRm7vQ6wuyy7rkYLIvTYiDncI4THYUsve7wuBuSCgFcHLUdon7xn7VrskjhMN4git6bjaY1+o4Knpfm3N72+9q/6+T52QIWCE1+Ku6UYYuOGy8qTgoijy24bp4jGEKAXqTXcALuBoukC3uB+xujhZYH1fbek6aEAQPYzO6sGqJqV1UoF0ascelzMbDJA4XOrKPr/5uJsPS+kGZguU16ykQb2k9K03TYHfvPP4rLe50Q9G4dSZFbUOQXdC3n13CuioEVzizUGl0HyT8MhRqw==",
            "name": config.key.name,
            "type": "ssh-rsa"
        };
        var unprocessedPublicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA14PDPWsaZMDspZNK7ABsppzwy++Ih2tRwjBkxzC2KEcQi7v8IcyODb7qLJ72tgx3G90zRm7vQ6wuyy7rkYLIvTYiDncI4THYUsve7wuBuSCgFcHLUdon7xn7VrskjhMN4git6bjaY1+o4Knpfm3N72+9q/6+T52QIWCE1+Ku6UYYuOGy8qTgoijy24bp4jGEKAXqTXcALuBoukC3uB+xujhZYH1fbek6aEAQPYzO6sGqJqV1UoF0ascelzMbDJA4XOrKPr/5uJsPS+kGZguU16ykQb2k9K03TYHfvPP4rLe50Q9G4dSZFbUOQXdC3n13CuioEVzizUGl0HyT8MhRqw==";

        describe('list', function(){
            it("should exist", function(){
               expect(ssh.list).to.be.an('function');
            });

            it("should return a list of ssh keys", function(done){

                var exampleReply = {
                    "data": [
                        processedSSHKey
                    ],
                    "status": "ok",
                    "type": "keys"
                };

                var getKeys = keys.get('').reply(200, exampleReply);

                ssh.list(credentials).then(function(result){
                    expect(result).to.be.an('array');
                    expect(result).to.have.length(1);
                    expect(result).to.eql(exampleReply.data);

                    getKeys.done();
                    done();
                });
            });
        });

        describe('delete', function(){
            it("should exist", function(){
                expect(ssh.delete).to.be.an('function');
            });

            it("should call DELETE", function(done){
                var delKeys = keys.delete('/' + processedSSHKey.name).reply(200);

                ssh.delete(credentials, processedSSHKey.name)
                    .then(function(){
                        delKeys.done();
                        done();
                    });
            });
        });

        describe('upload', function(){
            it("should exist", function(){
                expect(ssh.upload).to.be.an('function');
            });

            it("should call POST", function(done){

                var readFileAsync = sandbox.stub(fs, "readFileAsync").returns(Q(unprocessedPublicKey));

                var postKeys = keys.post('', processedSSHKey).reply(200);

                ssh.upload(credentials)
                    .then(function(){
                        sinon.assert.calledOnce(readFileAsync);
                        postKeys.done();
                        done();
                    });
            });
        });

        describe('update', function(){
            it("should exist", function(){
                expect(ssh.update).to.be.an('function');
            });

            it("should call POST when SSH Key does not exist on the server", function(done){

                var exampleReply = {
                    "data": [
                        processedSSHKey
                    ],
                    "status": "ok",
                    "type": "keys"
                };

                var readFileAsync = sandbox.stub(fs, "readFileAsync").returns(Q(unprocessedPublicKey));

                var scope = keys.get('/' + config.key.name)
                    .reply(404)
                    .post('', processedSSHKey)
                    .reply(200);

                ssh.update(credentials, processedSSHKey)
                    .then(function(){
                        sinon.assert.calledOnce(readFileAsync);
                        scope.done();
                        done();
                    });
            });

            it("should call PUT when SSH Key does exist but is not equal", function(done){

                var exampleGETReply = {
                    "status": "ok",
                    "data": differentProcessedSSHKey,
                    "type": "key"
                };

                var scope = keys
                    .get('/' + config.key.name)
                    .reply(200, exampleGETReply)
                    .put('/' + config.key.name, processedSSHKey)
                    .reply(200);

                ssh.update(credentials, processedSSHKey)
                    .then(function(){
                        scope.done();
                        done();
                    });
            });
        });
    });

    describe('application', function(){
        var application = require('../rest/application');

        var domains = nock('https://openshift.redhat.com/broker/rest/domains', {
            reqheaders: {
                'authorization': 'Basic dXNlcjpwYXNz',
                accept: '*/*'
            }
        });
        var credentials = {
            user: "user",
            pass: "pass"
        };

        describe('info', function(){
            it("should exist", function(){
                expect(application.info).to.be.an('function');
            });

            it("should get app information", function(done){
                var domainId = "domainId";
                var appId = "appId";

                var exampleResponse = {
                    "data": {
                        "aliases": [],
                        "app_url": "http://myapp-MyDomain.rhcloud.com/",
                        "build_job_url": null,
                        "building_app": null,
                        "building_with": null,
                        "creation_time": "2012-10-18T23:44:21Z",
                        "domain_id": "MyDomain",
                        "embedded": {
                            "haproxy-1.4": {},
                            "mysql-5.1": {
                                "connection_url": "mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/",
                                "database_name": "myapp",
                                "password": "zF2MfdIdGdMk",
                                "username": "admin",
                                "info": "Connection URL: mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/"
                            }
                        },
                        "framework": "php-5.3",
                        "gear_count": 2,
                        "gear_profile": "small",
                        "git_url": "ssh://dfd34495f6ab404e819d2f74ebd4cb50@myapp-MyDomain.rhcloud.com/~/git/myapp.git/",
                        "health_check_path": "health_check.php",
                        "initial_git_url": "",
                        "name": "myapp",
                        "scalable": true,
                        "ssh_url": "ssh://dfd34495f6ab404e819d2f74ebd4cb50@myapp-MyDomain.rhcloud.com",
                        "uuid": "dfd34495f6ab404e819d2f74ebd4cb50"
                    },
                    "messages": [],
                    "status": "ok",
                    "type": "application"
                };

                var scope = domains
                    .get('/' + domainId + '/applications/' + appId)
                    .reply(200, exampleResponse);

                application.info(credentials, domainId, appId)
                    .then(function(data){
                        expect(data).to.eql(exampleResponse.data);
                        scope.done();
                        done();
                    });
            });
        });
    })
});