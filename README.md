#OpenShift-Deployment

This tool allows it to deploy a given folder to OpenShift.

![BuildStatus](http://jenkins.tomm-apps.de/buildStatus/icon?job=openshift-deployment)
![Test](http://jenkins.tomm-apps.de:3434/badge/openshift-deployment/test)
![LastBuild](http://jenkins.tomm-apps.de:3434/badge/openshift-deployment/lastbuild)
![CodeCoverageInJenkins](http://jenkins.tomm-apps.de:3434/badge/openshift-deployment/coverage)

Installation
-------------

```
npm install openshift-deployment
```

Usage
---------

You will only need to do the following:

Create a new OpenShift application under a specific domain. This can be done on the OpenShift website or by using the tool rhc.
That's it. Now you are ready to use the deploy function. SSH key management will be done automatically for you. 
This tool generates a new SSH key on npm install.

```
var openshift = require('openshift');
openshift.deploy({user: 'example@test.com', pass: 'pass'}, 'myDomain', 'myApp', sourcePath).then(function(){
    //done
});
```

If the deployment was successful this function resolves.
