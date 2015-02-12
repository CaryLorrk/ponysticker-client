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
    var pkgImgObjStoreReady = false;
    var stickerImgObjStoreReady = false;
    var indexedDB = null;
    var IDBKeyRange = null;
    self.dbVersion = 1;

    self.init = init;
    self.addPackage = addPackage;
    self.deletePackage = deletePackage;
    self.updateMeta = updateMeta;
    self.getMeta = getMeta;
    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.getClassifiedTags = getClassifiedTags;
    self.getAllTags = getAllTags;
    self.getTagsWithIds = getTagsWithIds;
    self.getMetasPagination = getMetasPagination;
    self.getMetasWithTags = getMetasWithTags;
    self.getMetaPaginationByStar = getMetaPaginationByStar;
    self.getImg = getImg;

    function getMetaPaginationByStar(type) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var starRange = IDBKeyRange.only(1);
            var cursorReq;
                cursorReq = self.db
                .transaction([type], 'readonly')
                .objectStore(type)
                .index('star')
                .openCursor(starRange);

            cursorReq.onerror = function(e) {
                deferred.reject(e);
            };

            var items = [];

            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    items.push(cursor.value);
                    cursor.continue();
                } else {
                    deferred.resolve(items);
                }
            };
        });
        return buildPromise(deferred.promise);

    }

    function getMetasWithTags(type, tags) {
        var deferred = $q.defer();
        var tagsKey = Object.keys(tags);
        checkReadyBeforeWait(function() {
            var tagTransaction = self.db.transaction([type+'Tag'], 'readonly');
            var tagObjStore = tagTransaction.objectStore(type+'Tag');

            var tagsIds = [];
            tagsKey.forEach(function(tagKey, index) {
                tagsIds[index] = {};
                var tagRange = IDBKeyRange.only(tagKey);
                var cursorReq = tagObjStore.index('tag').openCursor(tagRange);
                cursorReq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        tagsIds[index][cursor.value.id] = true;
                        cursor.continue();
                    }
                };
            });

            tagTransaction.onerror = function(e) {
                deferred.reject(e);
            };

            tagTransaction.oncomplete = function(e) {
                var prev = tagsIds[0];
                for (var idx = 1; idx < tagsIds.length; idx+=1) {
                    prev = PonyModule.objIntersection(prev, tagsIds[idx]);
                }
                var transaction = self.db.transaction([type], 'readonly');
                var objStore = transaction.objectStore(type);

                var metas = [];
                for (var key in prev) {
                    if (prev.hasOwnProperty(key)) {
                        var id = parseInt(key);
                        objStore.get(id).onsuccess = function(e) {
                            metas.push(e.target.result);
                        };
                    }
                }

                transaction.onerror = function(e) {
                    deferred.reject(e);
                };

                transaction.oncomplete = function(e) {
                    deferred.resolve(metas);
                };
            };
        });
        return buildPromise(deferred.promise);
    }

    function getMetasPagination(type, page, size) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var cursorReq;
            if (type === 'sticker'){
                cursorReq = self.db
                .transaction(['sticker'], 'readonly')
                .objectStore('sticker')
                .index('recent')
                .openCursor(null, 'prev');
            } else {
                cursorReq = self.db
                .transaction([type], 'readonly')
                .objectStore(type)
                .openCursor();
            }

            cursorReq.onerror = function(e) {
                deferred.reject(e);
            };

            var count = 0;
            var items = [];
            var advancing = true;
            var hasNext = true;

            cursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    if (advancing) {
                        if (page === 1) {
                            items.push(cursor.value);
                            count += 1;
                            cursor.continue();
                        } else {
                            cursor.advance((page-1)*size);
                        }
                        advancing = false;
                    } else {
                        if (count < size) {
                            items.push(cursor.value);
                            count += 1;
                            cursor.continue();
                        } else {
                            deferred.resolve([items, hasNext]);
                        }
                    }
                } else {
                    hasNext = false;
                    deferred.resolve([items, hasNext]);
                }
            };
        });
        return buildPromise(deferred.promise);
    }

    function getTagsWithIds(type, ids, excludes) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var tagTransaction = self.db.transaction([type+'Tag'], 'readonly');
            var tagObjStore = tagTransaction.objectStore(type+'Tag');

            var idsTags = [];
            ids.forEach(function(id, index) {
                idsTags[index] = {};
                var idRange = IDBKeyRange.only(id);
                var cursorReq = tagObjStore.index('id').openCursor(idRange);
                cursorReq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var tag = cursor.value.tag;
                        if (!excludes[tag]) {
                            idsTags[index][tag] = true;
                        }
                        cursor.continue();
                    }
                };
            });

            tagTransaction.onerror = function(e) {
                deferred.reject(e);
            };

            tagTransaction.oncomplete = function(e) {
                var prev = idsTags[0];
                for (var idx = 1; idx < idsTags.length; idx+=1) {
                    prev = PonyModule.objUnionInPlace(prev, idsTags[idx]);
                }

                deferred.resolve(prev);
            };
        });
        return buildPromise(deferred.promise);
    }

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
            var idRange = IDBKeyRange.only(id);
            var transaction = self.db.transaction([objStoreName], 'readwrite');
            var objStore = transaction.objectStore(objStoreName);
            var cursorReq = objStore.index('id').openCursor(idRange);

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
            var idKeyRange = IDBKeyRange.only(id);
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
                self.db.transaction([
                'package', 'sticker',
                'packageTag', 'stickerTag',
                'packageImg', 'stickerImg'], 'readwrite');

            var pkgObjStore = transaction.objectStore('package');
            var stickerObjStore = transaction.objectStore('sticker');
            var pkgTagObjStore = transaction.objectStore('packageTag');
            var stickerTagObjStore = transaction.objectStore('stickerTag');
            var pkgImgObjStore = transaction.objectStore('packageImg');
            var stickerImgObjStore = transaction.objectStore('stickerImg');
            var getReq = pkgObjStore.get(packageId);
            getReq.onsuccess = function(e) {
                var meta = e.target.result;
                meta.stickers.forEach(function(sticker) {
                    var stickerIdRange = IDBKeyRange.only(sticker);
                    var stickerCursorReq = stickerTagObjStore.index('id').openCursor(stickerIdRange);
                    stickerCursorReq.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            stickerTagObjStore.delete(cursor.primaryKey);
                            cursor.continue();
                        }
                    };
                    stickerImgObjStore.delete(sticker);
                    stickerObjStore.delete(sticker);
                });
            };

            var pkgIdRange = IDBKeyRange.only(packageId);
            var pkgCursorReq = pkgTagObjStore.index('id').openCursor(pkgIdRange);
            pkgCursorReq.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    pkgTagObjStore.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
            pkgImgObjStore.delete(packageId);
            pkgObjStore.delete(packageId);


            transaction.oncomplete = function(e) {
                deferred.resolve(e);
            };

            transaction.onerror = function(e) {
                deferred.reject(e);
            };

        });
        return buildPromise(deferred.promise);

    }

    function updateMeta(type, meta) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var updateReq = self.db
            .transaction(type, 'readwrite')
            .objectStore(type)
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

    function getImg(type, id) {
        var deferred = $q.defer();
        checkReadyBeforeWait(function() {
            var getReq = self.db
            .transaction(type+'Img')
            .objectStore(type+'Img')
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
            var transaction = self.db.transaction([
                'package', 'sticker',
                'packageImg', 'stickerImg'], 'readwrite');
            var pkgObjStore = transaction.objectStore('package');
            var pkgImgObjStore = transaction.objectStore('packageImg');
            meta.date = Date.now();
            if (meta.star === undefined) {
                meta.star = 0;
            }
            pkgObjStore.add(meta);
            pkgImgObjStore.add({packageId: meta.packageId, base64: tabOnBase64});

            var stickerObjStore = transaction.objectStore('sticker');
            var stickerImgObjStore = transaction.objectStore('stickerImg');
            for (var key in stickersBase64) {
                if (stickersBase64.hasOwnProperty(key)){
                    var sticker = {
                        id: parseInt(key),
                        packageId: meta.packageId,
                        recent: 0,
                        star: 0,
                    };
                    stickerObjStore.add(sticker);
                    stickerImgObjStore.add({id: sticker.id, base64: stickersBase64[key]});
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
            stickerTagObjStoreReady &&
            pkgImgObjStoreReady &&
            stickerImgObjStoreReady;
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
            indexedDB = window._indexedDB || window.indexedDB;
            IDBKeyRange = window._IDBKeyRange || window.IDBKeyRange;
        } else {
            indexedDB = window.indexedDB || window._indexedDB;
            IDBKeyRange = window.IDBKeyRange || window._IDBKeyRange;
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

                var pkgImgObjStore = self.db.createObjectStore('packageImg', {keyPath: 'packageId'});
                pkgImgObjStore.transaction.oncomplete = function(e) {
                    pkgImgObjStoreReady = true;
                };
                pkgImgObjStore.transaction.onerror = function(e) {
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

                var stickerImgObjStore = self.db.createObjectStore('stickerImg', {keyPath: 'id'});
                stickerImgObjStore.transaction.oncomplete = function(e) {
                    stickerImgObjStoreReady = true;
                };
                stickerImgObjStore.transaction.onerror = function(e) {
                    //TODO
                };
            }
        }; 
        openReq.onsuccess = function(e) {
            pkgObjStoreReady = true;
            stickerObjStoreReady = true;
            pkgTagObjStoreReady = true;
            stickerTagObjStoreReady = true;
            pkgImgObjStoreReady = true;
            stickerImgObjStoreReady = true;
            self.db = e.target.result;
        };

        openReq.onerror = function() {
            //TODO
        };
    }
}
}());
