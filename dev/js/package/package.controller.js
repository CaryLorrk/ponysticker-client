(function () {
angular
.module('ponysticker.package')
.controller('PackageController', PackageController);

function PackageController($scope, $timeout, $ionicLoading, $ionicPopup, $ionicPopover, $state, 
                           $translate, stickerActionSheet, preference, googledrive,
                           backup, serverAPI, database, repo, packageId) {
    var self = this;
    var prefixDataURI = 'data:image/jpg;base64,';
    self.repo = repo;
    self.packageId = packageId;
    self.remote = false;
    self.favorite = false;
    self.stickersBase64 = {};
    self.isShowAll = false;
    self.hasError = false;
    self.stickers = [];
    self.stickerIdx = 0;
    self.hasMore = true;

    self.getTabOnUrl = getTabOnUrl;
    self.getStickerUrl = getStickerUrl;
    self.getTitle = getTitle;
    self.getAuthor = getAuthor;
    self.showAll = showAll;
    self.download = download;
    self.progress = progress;
    self.addFavorite = addFavorite;
    self.removeFavorite = removeFavorite;
    self.deletePackage = deletePackage;
    self.showMorePopover = showMorePopover;
    self.showActionSheet = showActionSheet;
    self.exportPackage = exportPackage;

    init();

    function exportPackage() {
        self.morePopover.hide();
        googledrive
        .auth()
        .then(function() {
            $scope.loading = {};
            $ionicLoading.show({
                scope: $scope,
                templateUrl: 'templates/loading.html'
            });
            backup.exportPackage(self.packageId)
            .then(function(data) {
                var date = new Date();
                var filename = 'package'+ self.packageId +'-'+
                    date.getFullYear() + '-' +
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
                showExportFail();
            });
        }, function(error) {
            showExportFail();
        });
        
    }

    function showExportFail() {
        $translate([
            'PACKAGE_EXPORT_ALERT_TITLE',
            'PACKAGE_EXPORT_ALERT_CONTENT'
        ])
        .then(function(trans) {
            $ionicPopup.alert({
                title: trans.PREFERENCE_EXPORT_ALERT_TITLE,
                template: trans.PREFERENCE_EXPORT_ALERT_CONTENT
            });
        });
    }

    function showActionSheet(sticker) {
        stickerActionSheet(sticker, false, self.stickersBase64[sticker], self.remote);
    }


    function showMorePopover($event) {
        self.morePopover.show($event);
    }

    function deletePackage() {
        $translate([
            'PACKAGE_DELETE_TITLE',
            'PACKAGE_DELETE_CONTENT',
            'PACKAGE_DELETE_CANCEL',
            'PACKAGE_DELETE_CONFIRM'])
        .then(checkDelete);

        function checkDelete(trans) {
            $ionicPopup.confirm({
                title: trans.PACKAGE_DELETE_TITLE,
                template: trans.PACKAGE_DELETE_CONTENT,
                cancelText: trans.PACKAGE_DELETE_CANCEL,
                okText: trans.PACKAGE_DELETE_CONFIRM,
                okType: 'button-assertive'
            })
            .then(function(res) {
                if (res) {
                    database
                    .deletePackage(self.packageId)
                    .success(function() {
                        self.remote = true;
                        self.favorite = false;
                    })
                    .error(function() {
                        //TODO
                    });
                }
            });
        }
    }

    function addFavorite() {
        self.meta.star = 1;
        database
        .updateMeta('package', self.meta)
        .success(function() {
            self.favorite = true;
        })
        .error(function() {
            //TODO
        });
    }

    function removeFavorite() {
        self.meta.star = 0;
        database
        .updateMeta('package', self.meta)
        .success(function() {
            self.favorite = false;
        })
        .error(function() {
            //TODO
        });
        
    }

    function progress() {
        var v = 0;
        if (self.tabOnBase64) {
            v += 1;
        }

        return v + PonyModule.objSize(self.stickersBase64);
    }

    function showAll() {
        self.isShowAll = true;
    }

    function download() {
        self.isDownloading = true;
        checkDownload();
        
        function checkDownload() {
            $timeout(function() {
                if (progress() < self.meta.stickers.length + 1) {
                    checkDownload();
                } else {
                    database
                    .addPackage(self.meta, self.tabOnBase64, self.stickersBase64)
                    .success(function() {
                        self.isDownloading = false;
                        self.remote = false;
                    })
                    .error(function() {
                        //TODO
                    });
                }
            }, 500);
        }
    }

    function getStickerUrl(sticker) {
        if (!self.stickersBase64[sticker]) {
            return '';
        }
        return prefixDataURI+self.stickersBase64[sticker];
    }

    function getTitle() {
        if (!self.meta) {
            return '';
        } 
        var title = self.meta.title[preference.getLanguage()];
        if (!title) {
            title = self.meta.title['en'];
        }
        
        return title;
    }

    function getAuthor() {
        if (!self.meta) {
            return '';  
        } 
        var author = self.meta.author[preference.getLanguage()];
        if (!author) {
            author = self.meta.author['en'];
        }
        
        return author;
    }

    function getTabOnUrl() {
        if (!self.tabOnBase64) {
            return '';
        }
        return prefixDataURI+self.tabOnBase64;
    }
    
    function init() {
        buildMorePopover();

        database
        .getMeta('package', self.packageId)
        .success(function(meta) {
            self.meta = meta;
            if (!self.meta) {
                self.remote = true;
                initFromRemote();
            } else {
                self.remote =false;
                self.favorite = self.meta.star;
                getStickersBase64();
                getTabOnBase64();
            }
        })
        .error(function(e) {
            //TODO
        });
    }

    function getTabOnBase64() {
        database
        .getImg('package', self.packageId)
        .success(function(img) {
            self.tabOnBase64 = img.base64;
        })
        .error(function() {
            //TODO
        });
    }

    function buildMorePopover() {
        self.morePopover = $ionicPopover.fromTemplateUrl(
            'templates/package-more-popover.html', {
            scope: $scope,
        }).then(function(popover) {
            self.morePopover = popover;
        });
    }

    function getStickersBase64() {
        self.meta.stickers.forEach(function(sticker) {
            database
            .getImg('sticker', sticker)
            .success(function(img) {
                self.stickersBase64[sticker] = img.base64;
            })
            .error(function() {
                //TODO
            });
        });
    }

    function initFromRemote() {
       serverAPI
       .getMeta(repo, packageId) 
       .success(function(data) {
           self.meta = data;
           getTabOnBase64Remote();
           getStickersBase64Remote();

       })
       .error(function() {
          self.hasError = true; 
       });
    }

    function getTabOnBase64Remote() {
        serverAPI
        .getStickerBase64(self.packageId, 'tab_on')
        .success(function(data) {
            self.tabOnBase64 = data;
        })
        .error(function() {
            self.tabOnBase64 = 0;
            self.hasError = true;
            
        });
    }

    function getStickersBase64Remote() {
        self.meta.stickers.forEach(function(sticker) {
            serverAPI
            .getStickerBase64(self.packageId, sticker)
            .success(function(data) {
                self.stickersBase64[sticker] = data;
            })
            .error(function() {
                self.stickersBase64[sticker] = 0;
                self.hasError = true;
                
            });
        });
    }
}
}());
