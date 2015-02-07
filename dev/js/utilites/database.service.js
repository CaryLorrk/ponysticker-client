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
    self.getPackage = getPackage;
    self.getSticker = getSticker;
    self.updatePackage = updatePackage;

    function deletePackage(packageId) {
        var deferred = $q.defer();
        checkReady(function(){
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
        checkReady(function() {
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

    function getSticker(sticker) {
        var deferred = $q.defer();
        checkReady(function() {
            var getReq = self.db
            .transaction('sticker')
            .objectStore('sticker')
            .get(sticker);

            getReq.onsuccess = function(e) {
                deferred.resolve(e);
            };
            getReq.onerror = function(e) {
                deferred.reject(e);
            };
        });

        return buildPromise(deferred.promise);

    }

    function getPackage(packageId) {
        var deferred = $q.defer();
        checkReady(function() {
            var getReq = self.db
            .transaction('package')
            .objectStore('package')
            .get(packageId);

            getReq.onsuccess = function(e) {
                deferred.resolve(e);
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
                        tags: [],
                        star: 0,
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
            window.shimIndexedDB.__useShim();
        }

        indexedDB = window._indexedDB || window.indexedDB;
        var openReq = indexedDB.open('ponyDB', self.dbVersion);
        openReq.onupgradeneeded = function(e) {
            self.db = e.target.result;
            if (e.oldVersion < 1) {
                var pkgObjStore = self.db.createObjectStore('package', {keyPath: 'packageId'});
                pkgObjStore.createIndex('date', 'date', {unique:false});
                pkgObjStore.createIndex('star', 'star', { unique: false });
                pkgObjStore.createIndex('tag', 'tags', { unique: false });

                pkgObjStore.transaction.oncomplete = function(e) {
                    pkgObjStoreReady = true;
                };

                pkgObjStore.transaction.onerror = function(e) {
                    //TODO
                };

                var stickerObjStore = self.db.createObjectStore('sticker', {keyPath: 'id'});
                stickerObjStore.createIndex('packageId', 'packageId', {unique: false});
                stickerObjStore.createIndex('recent', 'recent', {unique:false});
                stickerObjStore.createIndex('tag', 'tags', {unique:false, multiEntry: true});
                stickerObjStore.createIndex('star', 'star', {unique:false});

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
