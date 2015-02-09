(function () {
angular
.module('ponysticker.utilites')
.service('database', database);

function database($q, $timeout) {
    var self = this;
    var pkgObjStoreReady = false;
    var stickerObjStoreReady = false;
    self.dbVersion = 1;
    var indexedDB = null;

    self.init = init;
    self.addPackage = addPackage;
    self.deletePackage = deletePackage;
    self.updatePackage = updatePackage;
    self.getMeta = getMeta;
    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.getFilteredTags = getFilteredTags;

    function getFilteredTags(type, excludes) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var openCursorReq = self.db
                    .transaction([type], 'readonly')
                    .objectStore(type)
                    .index('tag')
                    .openKeyCursor();

            openCursorReq.onerror = function(e) {

                deferred.reject(e);
            };

            var prev = null;
            var tags = [];
            openCursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (cursor.key !== prev &&
                            excludes.indexOf(cursor.key) < 0) {
                        tags.push(cursor.key);
                        prev = cursor.key;
                    }
                    cursor.continue();
                } else {
                    deferred.resolve(tags);
                }
            };


        });
        return buildPromise(deferred.promise);
    }

    function addTag(tag, type, id) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var transaction = self.db.transaction([type], 'readwrite');
            var objStore = transaction.objectStore(type);
            var getReq = objStore.get(id);
            getReq.onsuccess = function(e) {
                var meta = e.target.result;
                meta.tags.push(tag);
                objStore.put(meta);
            };

            transaction.oncomplete = function(e) {
                deferred.resolve(e);
            };

            transaction.onerror = function(e) {
                deferred.reject(e);
            };
        });
        return buildPromise(deferred.promise);


    }

    function deleteTag(tag, type, id) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var transaction = self.db.transaction([type], 'readwrite');
            var objStore = transaction.objectStore(type);
            var getReq = objStore.get(id);
            getReq.onsuccess = function(e) {
                var meta = e.target.result;
                var idx = meta.tags.indexOf(tag);
                meta.tags.splice(idx, 1);
                objStore.put(meta);
            };

            transaction.oncomplete = function(e) {
                deferred.resolve(e);
            };

            transaction.onerror = function(e) {
                deferred.reject(e);
            };
        });
        return buildPromise(deferred.promise);
    }

    function updateTagsWithSet(meta, s) {
        meta.tags = s.keys();
        meta.tagObj = s.data;
    }

    function deletePackage(packageId) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function(){
            var transaction =
                self.db.transaction(['package', 'sticker'], 'readwrite');

            var pkgObjStore = transaction.objectStore('package');
            var stickerObjStore = transaction.objectStore('sticker');
            var getReq = pkgObjStore.get(packageId);
            getReq.onsuccess = function(e) {
                var meta = e.target.result;
                meta.stickers.forEach(function(sticker) {
                    stickerObjStore.delete(sticker);
                });
                pkgObjStore.delete(packageId);
            };


            transaction.oncomplete = function(e) {
                deferred.resolve(e);
            };

            transaction.onerror = function(e) {
                deferred.reject(e);
            };

        });
        return buildPromise(deferred.promise);

    }

    function updatePackage(meta) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var updateReq = self.db
            .transaction('package', 'readwrite')
            .objectStore('package')
            .put(meta);

            updateReq.onsuccess = function(e) {
                deferred.resolve(e);
            };
            updateReq.onerror = function(e) {
                deferred.reject(e);
            };

        });
        
        return buildPromise(deferred.promise);
    }

    function getMeta(type, id) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var getReq = self.db
            .transaction(type)
            .objectStore(type)
            .get(id);

            getReq.onsuccess = function(e) {
                deferred.resolve(e.target.result);
            };
            getReq.onerror = function(e) {
                deferred.reject(e);
            };
        });

        return buildPromise(deferred.promise);
    }

    function addPackage(meta, tabOnBase64, stickersBase64) {
        var deferred = $q.defer();
        checkReady(function() {
            var transaction = self.db.transaction(['package', 'sticker'], 'readwrite');
            var pkgObjStore = transaction.objectStore('package');
            meta.date = (new Date()).getTime();
            meta.star = 0;
            meta.tags = [];
            meta.tabOnBase64 = tabOnBase64;
            pkgObjStore.add(meta);

            var stickerObjStore = transaction.objectStore('sticker');
            for (var key in stickersBase64) {
                if (stickersBase64.hasOwnProperty(key)){
                    var sticker = {
                        id: parseInt(key),
                        packageId: meta.packageId,
                        recent: 0,
                        star: 0,
                        tags: [],
                        base64: stickersBase64[key]
                    };
                    stickerObjStore.add(sticker);
                }
            }

            transaction.oncomplete = function(e) {
                deferred.resolve(e);
            };

            transaction.onerror = function(e) {
                deferred.reject(e);
            };
        });

        return buildPromise(deferred.promise);
    }

    function checkReady(fn) {
        $timeout(function() {
            if(!isAllReady()) {
                checkReady(fn);
            } else {
                fn();
            }
        }, 200);
    }

    function checkReadyBeforeWait(fn) {
        if (isAllReady()) {
            fn();
        } else {
            checkReady(fn);
        }
    }

    function isAllReady() {
        return pkgObjStoreReady &&
            stickerObjStoreReady;

    }

    function buildPromise(promise) {
        promise.success = function(fn) {
            promise.then(function(e) {
                fn(e);
            });
            return promise;
        };

        promise.error = function(fn) {
            promise.then(null, function(e) {
                fn(e);
            });
            return promise;
        };

        return promise;
    }

    function init() {
        if (ionic.Platform.isWebView() || ionic.Platform.isIOS() || PonyModule.isSafari()) {
            indexedDB = window._indexedDB || window.indexedDB;
        } else {
            indexedDB = window.indexedDB || window._indexedDB;
        }

        if (!indexedDB) {
            //TODO
        }
        var openReq = indexedDB.open('ponyDB', self.dbVersion);
        openReq.onupgradeneeded = function(e) {
            self.db = e.target.result;
            if (e.oldVersion < 1) {
                var pkgObjStore = self.db.createObjectStore('package', {keyPath: 'packageId'});
                pkgObjStore.createIndex('date', 'date', {unique:false});
                pkgObjStore.createIndex('star', 'star', { unique: false });
                pkgObjStore.createIndex('tag', 'tags', { unique: false, multiEntry:true });
                pkgObjStore.transaction.oncomplete = function(e) {
                    pkgObjStoreReady = true;
                };
                pkgObjStore.transaction.onerror = function(e) {
                    //TODO
                };


                var stickerObjStore = self.db.createObjectStore('sticker', {keyPath: 'id'});
                stickerObjStore.createIndex('packageId', 'packageId', {unique: false});
                stickerObjStore.createIndex('recent', 'recent', {unique:false});
                stickerObjStore.createIndex('star', 'star', {unique:false});
                stickerObjStore.createIndex('tag', 'tags', { unique: false, multiEntry:true });
                stickerObjStore.transaction.oncomplete = function(e) {
                    stickerObjStoreReady = true;
                };
                stickerObjStore.transaction.onerror = function(e) {
                    //TODO
                };

                

            }
        }; 
        openReq.onsuccess = function(e) {
            pkgObjStoreReady = true;
            stickerObjStoreReady = true;
            self.db = e.target.result;
        };

        openReq.onerror = function() {
            //TODO
        };
    }
}
}());
