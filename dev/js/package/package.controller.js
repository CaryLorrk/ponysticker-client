(function () {
angular
.module('ponysticker.package')
.controller('PackageController', PackageController);

function PackageController($scope, $timeout, $ionicActionSheet, $ionicPopup, $ionicPopover, $state, 
                           $translate, preference, serverAPI, database, repo, packageId) {
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
    self.loadMore = loadMore;
    self.showMorePopover = showMorePopover;
    self.showActionSheet = showActionSheet;

    init();

    function showActionSheet(sticker) {
        $translate([
            'PACKAGE_SET_TAGS',
            'PACKAGE_CANCEL'
        ])
        .then(function(trans) {
            $ionicActionSheet.show({
                buttons: [
                    { text: trans.PACKAGE_SET_TAGS },
                ],
                cancelText: trans.PACKAGE_CANCEL,
                buttonClicked: function(index) {
                    switch(index) {
                    case 0:
                        actionSheetSetTags(sticker);
                        break;
                    }
                    return true;
                },
            });
        });
    }

    function actionSheetSetTags(sticker) {
        if (!self.remote) {
            $state.go('tags', {
                type:'sticker',
                id: sticker});
        } else {
            $translate([
                'PACKAGE_ALERT_TITLE',
                'PACKAGE_DOWNLOAD_FIRST',
                'PACKAGE_OK'])
            .then(function(trans) {
                $ionicPopup.alert({
                    title: trans.PACKAGE_ALERT_TITLE,
                    template: '<p class="text-center">'+trans.PACKAGE_DOWNLOAD_FIRST+'</p>',
                    okText: trans.PACKAGE_OK
                });
            });
        }
        
    }

    function showMorePopover($event) {
        self.morePopover.show($event);
    }

    function loadMore() {
        var step = 6;
        if (!self.meta) {
            waitMeta(loadData);
        } else {
            loadData();
        }

        $timeout(function() {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, 100);

        function waitMeta(fn) {
            $timeout(function(){
                if (!self.meta) {
                    waitMeta(fn);
                } else {
                    fn();
                }
            }, 100);
        }

        function loadData() {
            self.stickers = self.stickers.concat(self.meta.stickers.slice(self.stickerIdx, self.stickerIdx+step));
            self.stickerIdx += step;
            if (self.stickerIdx > self.meta.stickers.length) {
                self.hasMore = false;
            }
            
        }
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
        .updatePackage(self.meta)
        .success(function() {
            self.favorite = true;
        })
        .error(function() {
            //TODO
        });
    }

    function removeFavorite() {
        self.meta.star = 1;
        database
        .updatePackage(self.meta)
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
                self.tabOnBase64 = self.meta.tabOnBase64;
                getStickersBase64();
            }
        })
        .error(function(e) {
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
            .getMeta('sticker', sticker)
            .success(function(meta) {
                self.stickersBase64[sticker] = meta.base64;
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
