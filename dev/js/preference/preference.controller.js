(function () {
angular
.module('ponysticker.preference')
.controller('PreferenceController', PreferenceController); 

function PreferenceController($ionicHistory, $translate, preference) {
    var self = this;
    self.language = preference.getLanguage();
    self.pageSize = preference.getPageSize();
    self.server = preference.getServer();

    self.updateLanguage = updateLanguage;
    self.updatePageSize = updatePageSize;
    self.updateServer = updateServer;

    init();

    function init() {
        getSpace();
    }

    function updateLanguage() {
        preference.setLanguage(self.language);
        $translate.use(self.language);
    }

    function updateServer() {
        preference.setServer(self.server);
    }

    function updatePageSize() {
        preference.setPageSize(self.pageSize);
        $ionicHistory.clearCache();
    }

    function getSpace() {
        if (ionic.Platform.isWebView()) {
            return;
        }
        if (navigator.webkitTemporaryStorage) {
            navigator
            .webkitTemporaryStorage
            .queryUsageAndQuota(function(used, remaining) {
                self.usedMB = parseInt(used/1024/1024);
                self.totalMB = parseInt((remaining+used)/1024/1024);
            }, function(e) {
                //TODO
            });
            return;
        }

        if (window.webkitStorageInfo) {
            window
            .webkitStorageInfo
            .queryUsageAndQuota(window.webkitStorageInfo.TEMPORAR, function(used, remaining) {
                self.usedMB = parseInt(used/1024/1024);
                self.totalMB = parseInt((remaining+used)/1024/1024);

            }, function (e) {
                //TODO
            });
            return;
        }

        if (ionic.Platform.isIOS()) {
            self.usedMB = 'unknown';
            self.totalMB = '50';
        }
        
    }
}
}());
