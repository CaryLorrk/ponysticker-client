(function () {
angular
.module('ponysticker.preference')
.service('googledrive', googledrive);

function googledrive($ionicPlatform, $timeout, $http, $q, $cordovaOauth, preference) {
    var self = this;
    var CLIENT_ID;
    $ionicPlatform.ready(function() {
        if (ionic.Platform.isWebView()) {
            CLIENT_ID = '826702538511-4ue3qu71ujbga5qa5id8s7k76k1ssq3e.apps.googleusercontent.com';
        } else {
            CLIENT_ID = '826702538511-cgmsl0n36bekvihgl1pb7smv9hj1r5n3.apps.googleusercontent.com';
        }
    });
    var SCOPES = 'https://www.googleapis.com/auth/drive';

    self.auth = auth;
    self.uploadJson = uploadJson;
    
    function auth() {
        var deferred = $q.defer();
        if (!window.gapi) {
            $.getScript('https://apis.google.com/js/client.js?onload=handleClientLoad', hasGapi);
        } else {
            hasGapi();
        }

        function checkAuth() {
            window.gapi.auth.authorize({
                    'client_id': CLIENT_ID,
                    'scope': SCOPES,
                    'immediate': true
            }, function(authResult) {
                if (authResult && !authResult.error) {
                    deferred.resolve();
                } else {
                    window.gapi.auth.authorize({
                    'client_id': CLIENT_ID,
                    'scope': SCOPES,
                    'immediate': false
                    }, function(authResult) {
                        if (authResult && !authResult.error) {
                            deferred.resolve();
                        } else {
                            deferred.reject(authResult.error);
                        }
                    });
                }
            });
        }

        function webViewCheckAuth() {
            var authToken = window.gapi.auth.getToken() || preference.getDriveToken();
            if (authToken && authToken['access_token']) {
                $http.get('https://www.googleapis.com/oauth2/v1/tokeninfo', {
                    params: {
                        'access_token': authToken['access_token']
                    }
                })
                .success(function(result) {
                    if (result && !result.error) {
                        preference.setDriveToken(authToken);
                        window.gapi.auth.setToken(authToken);
                        deferred.resolve();
                    } else {
                        webViewGetAuth();
                    }
                })
                .error(function() {
                    webViewGetAuth();
                });
            } else {
                webViewGetAuth();
            }
        }

        function webViewGetAuth() {
            $cordovaOauth.google(CLIENT_ID, [SCOPES])
            .then(function(authResult) {
                if (authResult && !authResult.error) {
                    preference.setDriveToken(authResult);
                    window.gapi.auth.setToken(authResult);
                    deferred.resolve();
                } else {
                    deferred.reject(authResult.error);
                }
            }, function(authResult) {
                deferred.reject(authResult.error);
            });
        }

        function hasGapi() {
            if (ionic.Platform.isWebView()) {
                waitGapiAuth(webViewCheckAuth);
            } else {
                waitGapiAuth(checkAuth);
            }
        }

        return deferred.promise;
    }

    function waitGapiAuth(fn, args) {
        $timeout(function() {
            if (!window.gapi || !window.gapi.auth) {
                waitGapiAuth(fn, args);
            } else {
                fn(args);
            }
        }, 1);
    }

    function uploadJson(filename, data, callback) {
        if (!window.gapi) {
            $.getScript('https://apis.google.com/js/client.js?onload=handleClientLoad', hasGapi);
        } else {
            hasGapi();
        }

        function hasGapi () {
            var boundary = '-------314159265358979323846';
            var delimiter = '\r\n--' + boundary + '\r\n';
            var closeDelim = '\r\n--' + boundary + '--';

            var contentType = 'application/json';
            var metadata = {
                'title': filename,
                'mimeType': contentType
            };

            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                '\r\n' +
                JSON.stringify(data) +
                closeDelim;

            waitGapiClient(sendRequest);

            function sendRequest() {
                var request = window.gapi.client.request({
                    'path': '/upload/drive/v2/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': {
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    }, 'body': multipartRequestBody});

                    if (!callback) {
                        callback = function(file) {
                            console.log(file);
                        };
                    }
                    request.execute(callback);
            }
        }

        function waitGapiClient(fn, args) {
            $timeout(function() {
                if (!window.gapi || !window.gapi.client) {
                    waitGapiClient(fn, args);
                } else {
                    fn(args);
                }
            }, 100);
        }
    }
}
}());
