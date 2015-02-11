(function () {
angular
.module('ponysticker.preference')
.service('backup', backup);

function backup($q, $timeout, $ionicLoading, database, serverAPI) {
    var self = this;

    self.importData = importData;

    function importData(data, $scope) {
        var deferred = $q.defer();
        var version = data.version;
        var next = true;
        var hasError = false;
        $scope.loading.complete = 0;
        $scope.loading.total = data.package.length;
        if (!version) {
            version = 1;
        }


        data.package.forEach(function(pkg, index) {
            checkNext(processPackage, [pkg, index]);
        });
        
        return deferred.promise;

        function checkNext(fn, args) {
            $timeout(function() {
                if (next) {
                    fn.apply(this, args);
                } else {
                    checkNext(fn, args);
                }
            }, 1);
        }
        
        function processPackage(pkg, index) {
            if (version === 1 &&
                pkg.packageId >= 5000000) {
                $scope.loading.complete += 1;
                return;
            }
            next = false;
            var meta = null;
            var tabOnBase64 = null;
            var stickersBase64 = {};
            var stickersCount = 0;
            var repo = checkRepo(pkg.packageId);
            var error = false;
            
            checkLocal();


            function checkLocal() {
                database
                .getMeta('package', pkg.packageId)
                .success(function(data) {
                    if (!data) {
                        getDataRemote();
                        waitDonwloading();
                    } else {
                        meta = data;
                        updateMeta();
                    }
                })
                .error(function() {
                    error = true;
                    completePackage();
                    //TODO
                });
            }

            function updateMeta() {
                meta.star = pkg.star;
                database
                .updateMeta('package', meta)
                .success(function() {
                    completePackage();
                })
                .error(function() {
                    error = true;
                    completePackage();
                    //TODO
                });
            }


            function getDataRemote() {
                serverAPI
                .getMeta(repo, pkg.packageId)
                .success(function(data) {
                    meta = data;
                    getTabOnBase64Remote();
                    getStickersBase64Remote();
                })
                .error(function() {
                    error = true;
                    //TODO
                });
            }

            function getTabOnBase64Remote() {
                serverAPI
                .getStickerBase64(pkg.packageId, 'tab_on')
                .success(function(data) {
                    tabOnBase64 = data;
                })
                .error(function() {
                    error = true;
                    //TODO
                });
            }

            function getStickersBase64Remote() {
                meta.stickers.forEach(function(sticker) {
                    serverAPI
                    .getStickerBase64(pkg.packageId, sticker)
                    .success(function(data) {
                        stickersBase64[sticker] = data;
                        stickersCount += 1;
                    })
                    .error(function() {
                        error = true;
                        //TODO
                    });
                });
            }

            function waitDonwloading() {
                $timeout(function() {
                    if (meta && tabOnBase64 &&
                            stickersCount === meta.stickers.length) {
                        meta.star = pkg.star;
                        addPackage();
                    } else if (error) {
                        completePackage();
                    } else {
                        waitDonwloading();
                    }
                }, 1);
            }

            function addPackage() {
                database
                .addPackage(meta, tabOnBase64, stickersBase64)
                .success(function() {
                    completePackage();
                })
                .error(function() {
                    error = true;
                    completePackage();
                    //TODO
                });
            }

            function completePackage() {
                next = true;
                hasError = error;
                if (++$scope.loading.complete === data.package.length) {
                    processStickers();
                }
            }
        }

        function processStickers() {
            $scope.loading.stickerComplete = 0;
            $scope.loading.stickerTotal = data.sticker.length;
            data.sticker.forEach(function(sticker) {
                processSticker(sticker);
            });
        }

        function processSticker(sticker) {
            var error = false;
            var meta = null;
            var tags = null;
            getMeta();

            function getMeta() {
                database
                .getMeta('sticker', sticker.id)
                .success(function(data) {
                    if (data) {
                        meta = data;
                        getTags();
                    } else {
                        completeSticker();
                    }
                })
                .error(function() {
                    error = true;
                    completeSticker();
                    //TODO
                });
            }

            function getTags() {
                database
                .getTagsWithIds('sticker', [sticker.id], [])
                .success(function(data) {
                    tags = data;
                    updateMeta();
                })
                .error(function() {
                    error = true;
                    completeSticker();
                    //TODO
                });
            }

            function updateMeta() {
                meta.recent = sticker.recent || sticker.time;
                meta.star = sticker.star;
                database
                .updateMeta('sticker', meta)
                .success(function() {
                    updateTags();
                })
                .error(function() {
                    error = true;
                    completeSticker();
                    //TODO
                });
            }

            function updateTags() {
                sticker.tags = [];
                if (sticker.tag) {
                    sticker.tags = sticker.tag.split(' ');
                } else {
                    completeSticker();
                }
                var totalTag = sticker.tags.length;
                var tagCount = 0;
                sticker.tags.forEach(function(tag) {
                    if (!tags[tag]) {
                        database
                        .addTag(tag, 'sticker', sticker.id)
                        .success(function() {
                            if (++tagCount === totalTag) {
                                completeSticker();
                            }
                        })
                        .error(function() {
                            error = true;
                            completeSticker();
                            //TODO
                        });
                    } else {
                        if (--totalTag === tagCount) {
                            completeSticker();
                        }
                    }
                });
            }

            function completeSticker() {
                if (error) {
                    hasError = error;
                }
                if(++$scope.loading.stickerComplete ===
                   $scope.loading.stickerTotal) {
                    deferred.resolve(hasError);
                }
            }
        }

        function checkRepo(id) {
            if (id < 0) {
                return 'custom';
            } else if (id < 1000000) {
                return 'official';
            } else {
                return 'creator';
            }
        }
    }
}
}());
