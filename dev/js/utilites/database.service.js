(function () {
angular
.module('ponysticker.utilites')
.service('database', database);

function database($q, $timeout) {
    var self = this;
    var pkgObjStoreReady = false;
    var stickerObjStoreReady = false;
    var pkgTagObjStoreReady = false;
    var stickerTagObjStoreReady = false;
    var indexedDB = null;
    self.dbVersion = 1;

    self.init = init;
    self.addPackage = addPackage;
    self.deletePackage = deletePackage;
    self.updatePackage = updatePackage;
    self.getMeta = getMeta;
    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.getClassifiedTags = getClassifiedTags;
    self.getAllTags = getAllTags;

    function getAllTags(type) {
        var objStoreName = type+'Tag';
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var cursorReq = self.db
            .transaction([objStoreName], 'readonly')
            .objectStore(objStoreName)
            .openCursor();

            cursorReq.onerror = function(e) {
                deferred.reject(e);
            };

            var tags = {};
            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    tags[cursor.value.tag] = true;
                    cursor.continue();
                } else {
                    deferred.resolve(tags);
                }
            };
        });
        return buildPromise(deferred.promise);

    }

    function getClassifiedTags(type, id) {
        var objStoreName = type+'Tag';
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var cursorReq = self.db
            .transaction([objStoreName], 'readonly')
            .objectStore(objStoreName)
            .openCursor();

            cursorReq.onerror = function(e) {
                deferred.reject(e);
            };

            var selected = {};
            var unselected = {};
            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.id === id) {
                        selected[cursor.value.tag] = true;
                    } else {
                        unselected[cursor.value.tag] = true;
                    }
                    cursor.continue();
                } else {
                    for (var key in selected) {
                        if (selected.hasOwnProperty(key)) {
                            delete unselected[key];
                        }
                    }
                    deferred.resolve([selected, unselected]);
                }
            };
        });
        return buildPromise(deferred.promise);
    }

    function addTag(tag, type, id) {
        var objStoreName = type+'Tag';
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var idKeyRange = window.IDBKeyRange.only(id);
            var transaction = self.db.transaction([objStoreName], 'readwrite');
            var objStore = transaction.objectStore(objStoreName);
            var cursorReq = objStore.index('id').openCursor(idKeyRange);

            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.tag !== tag) {
                        cursor.continue();
                    }
                } else {
                    var putReq = objStore.put({tag: tag, id: id});
                }
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
        var objStoreName = type+'Tag';
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var idKeyRange = window.IDBKeyRange.only(id);
            var transaction = self.db.transaction([objStoreName], 'readwrite');
            var objStore = transaction.objectStore(objStoreName);
            var cursorReq = objStore.index('id').openCursor(idKeyRange);

            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.tag === tag) {
                        var deleteReq = objStore.delete(cursor.primaryKey);
                    } else {
                        cursor.continue();
                    }
                }
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
            meta.tags = {};
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
                        tags: {},
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
            stickerObjStoreReady &&
            pkgTagObjStoreReady &&
            stickerTagObjStoreReady;
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
                pkgObjStore.transaction.oncomplete = function(e) {
                    pkgObjStoreReady = true;
                };
                pkgObjStore.transaction.onerror = function(e) {
                    //TODO
                };

                var pkgTagObjStore = self.db.createObjectStore('packageTag', {autoIncrement: true});
                pkgTagObjStore.createIndex('tag', 'tag', {unique: false});
                pkgTagObjStore.createIndex('id', 'id', {unique: false});
                pkgTagObjStore.transaction.oncomplete = function(e) {
                    pkgTagObjStoreReady = true;
                };
                pkgTagObjStore.transaction.onerror = function(e) {
                    //TODO
                };


                var stickerObjStore = self.db.createObjectStore('sticker', {keyPath: 'id'});
                stickerObjStore.createIndex('packageId', 'packageId', {unique: false});
                stickerObjStore.createIndex('recent', 'recent', {unique:false});
                stickerObjStore.createIndex('star', 'star', {unique:false});
                stickerObjStore.transaction.oncomplete = function(e) {
                    stickerObjStoreReady = true;
                };
                stickerObjStore.transaction.onerror = function(e) {
                    //TODO
                };

                var stickerTagObjStore = self.db.createObjectStore('stickerTag', {autoIncrement: true});
                stickerTagObjStore.createIndex('tag', 'tag', {unique: false});
                stickerTagObjStore.createIndex('id', 'id', {unique: false});
                stickerTagObjStore.transaction.oncomplete = function(e) {
                    stickerTagObjStoreReady = true;
                };
                stickerTagObjStore.transaction.onerror = function(e) {
                    //TODO
                };
            }
        }; 
        openReq.onsuccess = function(e) {
            pkgObjStoreReady = true;
            stickerObjStoreReady = true;
            pkgTagObjStoreReady = true;
            stickerTagObjStoreReady = true;
            self.db = e.target.result;
        };

        openReq.onerror = function() {
            //TODO
        };
    }
}
}());
