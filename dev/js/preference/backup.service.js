(function () {
angular
.module('ponysticker.preference')
.service('backup', backup);

function backup($q, $timeout, $ionicLoading, database, serverAPI) {
    var self = this;

    self.importData = importData;
    self.exportData = exportData;
    self.exportPackage = exportPackage;

    function exportPackage(packageId) {
        var deferred = $q.defer();
        var data = {};
        data.version = 2;
        var transaction = database.db.transaction([
            'package', 'sticker',
            'packageTag', 'stickerTag']);

        var pkgObjStore = transaction.objectStore('package');
        var stickerObjStore = transaction.objectStore('sticker');
        var pkgTagObjStore = transaction.objectStore('packageTag');
        var stickerTagObjStore = transaction.objectStore('stickerTag');
        data.package = [];
        var pkgReq = pkgObjStore.get(packageId);
        pkgReq.onsuccess = function(e) {
            var meta = e.target.result;
            meta.tag = [];
            var idRange = window.IDBKeyRange.only(meta.packageId);
            var pkgTagCursor = pkgTagObjStore
            .index('id')
            .openCursor(idRange);
            pkgTagCursor.onsuccess = function(e) {
                var tagCursor = e.target.result;
                if (tagCursor) {
                    meta.tag.push(tagCursor.value.tag);
                    tagCursor.continue();
                } else {
                    data.package.push(meta);
                    data.sticker = [];
                    meta.stickers.forEach(function(id) {
                        processSticker(id);
                    });
                }
            };
        };

        function processSticker(id) {
            var stickerReq = stickerObjStore.get(id);
            stickerReq.onsuccess = function(e) {
                var meta = e.target.result;
                console.log(meta);
                meta.tag = [];
                var idRange = window.IDBKeyRange.only(meta.id);
                var stickerTagCursor = stickerTagObjStore
                .index('id')
                .openCursor(idRange);
                stickerTagCursor.onsuccess = function(e) {
                    var tagCursor = e.target.result;
                    if (tagCursor) {
                        meta.tag.push(tagCursor.value.tag);
                        tagCursor.continue();
                    } else {
                        data.sticker.push(meta);
                    }
                };
            };
        }

        transaction.oncomplete = function() {
            deferred.resolve(data);
        };
        
        transaction.onerror = function(e) {
            deferred.reject(e);
        };


        return deferred.promise;

    }

    function exportData() {
        var deferred = $q.defer();
        var data = {};
        data.version = 2;
        var transaction = database.db.transaction([
            'package', 'sticker',
            'packageTag', 'stickerTag']);

        var pkgObjStore = transaction.objectStore('package');
        var stickerObjStore = transaction.objectStore('sticker');
        var pkgTagObjStore = transaction.objectStore('packageTag');
        var stickerTagObjStore = transaction.objectStore('stickerTag');

        data.package = [];
        var pkgCursor = pkgObjStore.openCursor();
        pkgCursor.onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var meta = cursor.value;
                meta.tag = [];
                var idRange = window.IDBKeyRange.only(meta.packageId);
                var pkgTagCursor = pkgTagObjStore
                .index('id')
                .openCursor(idRange);
                pkgTagCursor.onsuccess = function(e) {
                    var tagCursor = e.target.result;
                    if (tagCursor) {
                        meta.tag.push(tagCursor.value.tag);
                        tagCursor.continue();
                    } else {
                        data.package.push(meta);
                        cursor.continue();
                    }
                };
            } else {
                processStickers();
            }
        };

        function processStickers() {
            data.sticker = [];
            var stickerCursor = stickerObjStore.openCursor();
            stickerCursor.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    var meta = cursor.value;
                    meta.tag = [];
                    var idRange = window.IDBKeyRange.only(meta.id);
                    var stickerTagCursor = stickerTagObjStore
                    .index('id')
                    .openCursor(idRange);
                    stickerTagCursor.onsuccess = function(e) {
                        var tagCursor = e.target.result;
                        if (tagCursor) {
                            meta.tag.push(tagCursor.value.tag);
                            tagCursor.continue();
                        } else {
                            data.sticker.push(meta);
                            cursor.continue();
                        }
                    };
                }
            };
        }

        transaction.oncomplete = function() {
            deferred.resolve(data);
        };
        
        transaction.onerror = function(e) {
            deferred.reject(e);
        };

        return deferred.promise;
    }

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
            var tags = null;
            
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
                    getTags();
                    //completePackage();
                })
                .error(function() {
                    error = true;
                    completePackage();
                    //TODO
                });
            }

            function getTags() {
                database
                .getTagsWithIds('package', [pkg.packageId], [])
                .success(function(data) {
                    tags = data;
                    updateTags();
                })
                .error(function() {
                    error = true;
                    completePackage();
                    //TODO
                });
            }

            function updateTags() {
                pkg.tags = [];
                if (Array.isArray(pkg.tag)) {
                    pkg.tags = pkg.tag;
                } else if (pkg.tag) {
                    pkg.tags = pkg.tag.split(' ');
                }

                if (pkg.tags.length <= 0) {
                    completePackage();
                    return;
                }
                var totalTag = pkg.tags.length;
                var tagCount = 0;
                pkg.tags.forEach(function(tag) {
                    if(!tags[tag]) {
                        database
                        .addTag(tag, 'package', pkg.packageId)
                        .success(function() {
                            if (++tagCount === totalTag) {
                                completePackage();
                            }
                        })
                        .error(function() {
                            error = true;
                            completePackage();
                            //TODO
                        });
                    } else {
                        if (--totalTag === tagCount) {
                            completePackage();
                        }
                    }
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
                meta.recent = sticker.recent;
                if (meta.recent === undefined) {
                    meta.recent = sticker.time;
                }

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
                if (Array.isArray(sticker.tag)) {
                    sticker.tags = sticker.tag;
                } else if (sticker.tag) {
                    sticker.tags = sticker.tag.split(' ');
                }

                if (sticker.tags.length <= 0) {
                    completeSticker();
                    return;
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
