(function () {
angular
.module('ponysticker.preference')
.controller('PreferenceController', PreferenceController); 

function PreferenceController($scope, $ionicPopup, $ionicLoading, $ionicHistory,
                              $translate, preference, backup, googledrive) {
    var self = this;
    self.language = preference.getLanguage();
    self.pageSize = preference.getPageSize();
    self.server = preference.getServer();
    self.uploaded = null;

    self.updateLanguage = updateLanguage;
    self.updatePageSize = updatePageSize;
    self.updateServer = updateServer;
    self.change = change;
    self.exportData = exportData;

    init();

    function exportData() {
        googledrive
        .auth()
        .then(function() {
            $scope.loading = {};
            $ionicLoading.show({
                scope: $scope,
                templateUrl: 'templates/loading.html'
            });
            backup.exportData()
            .then(function(data) {
                var date = new Date();
                var filename = 'database-'+ date.getFullYear() + '-' +
                    (date.getMonth()+1) + '-' +
                    date.getDate() + '-' +
                    date.getHours() + '.' +
                    date.getMinutes() + '.' +
                    date.getSeconds() + '.json';
                googledrive.uploadJson(filename, data, function(file) {
                    $ionicLoading.hide();
                    if(!file.title) {
                        showExportFail();
                    }
                });

            }, function() {
                $ionicLoading.hide();
                showExportFail();
            });
        }, function(error) {
            //TODO
        });
    }

    function showExportFail() {
        $translate([
            'PREFERENCE_EXPORT_ALERT_TITLE',
            'PREFERENCE_EXPORT_ALERT_CONTENT'
        ])
        .then(function(trans) {
            $ionicPopup.alert({
                title: trans.PREFERENCE_EXPORT_ALERT_TITLE,
                template: trans.PREFERENCE_EXPORT_ALERT_CONTENT
            });
        });
    }


    function change() {
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = JSON.parse(e.target.result);

            $scope.loading = {};
            $ionicLoading.show({
                scope: $scope,
                templateUrl: 'templates/loading.html'
            });
            backup.importData(data, $scope)
            .then(function(hasError) {
                $ionicLoading.hide();
                if (hasError) {
                    $translate([
                        'PREFERENCE_IMPORT_ALERT_TITLE',
                        'PREFERENCE_IMPORT_ALERT_CONTENT'
                    ])
                    .then(function(trans) {
                        $ionicPopup.alert({
                            title: trans.PREFERENCE_IMPORT_ALERT_TITLE,
                            template: trans.PREFERENCE_IMPORT_ALERT_CONTENT
                        });
                    });
                }

            });
        };
        reader.readAsText(self.uploaded[0]);
    }

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
