(function () {
angular
.module('ponysticker.local')
.controller('LocalController', LocalController);

function LocalController($scope, $ionicModal, $ionicScrollDelegate, preference, database, type) {
    var self = this;
    self.type = type;
    self.selected = {};
    self.unselected = {};
    self.getKeys = getKeys;
    self.page = 1;
    self.hasNext = false;
    self.pageSize = preference.getPageSize();

    self.query = '';
    self.items = [];
    self.itemImgs = {};

    self.showTagModal = showTagModal;
    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.clearTags = clearTags;
    self.getKeys = getKeys;
    self.goPrev = goPrev;
    self.goNext = goNext;
    self.getItemId = getItemId;
    self.checkHasNext = checkHasNext;
    self.getItems = getItems;
    self.getItemImgUrl = getItemImgUrl;
    
    init();

    function getItemImgUrl(itemId) {
        if (!self.itemImgs[itemId]) {
            return '';
        }
        return 'data:image/jpg;base64,'+self.itemImgs[itemId];
    }

    function getItems() {
        if ($.isEmptyObject(self.selected)) {
            return self.items;
        } else {
            return self.items.slice(
                (self.page-1)*self.pageSize,
                self.page*self.pageSize);
        }

    }

    function checkHasNext() {
        if ($.isEmptyObject(self.selected)) {
            return self.hasNext;
        } else {
            return self.page < self.items.length / self.pageSize ;
        }
    }

    function getItemId(item) {
        if (self.type === 'package') {
            return item.packageId;
        } else {
            return item.id;
        }
    }

    function goPrev() {
        self.page -= 1;
        if ($.isEmptyObject(self.selected)) {
            refreshItems(false);
        }
        $ionicScrollDelegate.scrollTop();
    }

    function goNext() {
        self.page += 1;
        if ($.isEmptyObject(self.selected)) {
            refreshItems(false);
        }
        $ionicScrollDelegate.scrollTop();
    }

    function clearTags() {
        for (var key in self.selected) {
            if (self.selected.hasOwnProperty(key)) {
                self.unselected[key] = true;
                delete self.selected[key];
            }
        }
    }

    function addTag(tag) {
        self.selected[tag] = true;
        delete self.unselected[tag];
        self.page = 1;
        refreshItems(true);
    }

    function deleteTag(tag) {
        self.unselected[tag] = true;
        delete self.selected[tag];
        self.page = 1;
        refreshItems(true);
    }

    function showTagModal() {
        self.tagModal.show();
    }

    function getKeys(obj) {
        return Object.keys(obj);
    }

    function init() {
        buildModal();
        $scope.$on('$ionicView.enter', enterCheck);
    }

    function enterCheck() {
        refreshItems(true);
    }

    function refreshItems(tag) {
        if ($.isEmptyObject(self.selected)) {
            database
            .getMetasPagination(self.type, self.page, self.pageSize)
            .success(function(res) {
                self.items = res[0];
                self.hasNext = res[1];
                refreshItemImgs();
                if (tag) {
                    refreshTags();
                }
            })
            .error(function(e) {
                //TODO
            });
        } else {
            database
            .getMetasWithTags(self.type, self.page,
                             self.pageSize, self.selected)
            .success(function(res) {
                self.items = res;
                refreshItemImgs();
                if (tag) {
                    refreshTags();
                }
            })
            .error(function() {
                //TODO
            });
        }
    }

    function refreshItemImgs() {
        var idName;
        if (self.type === 'package') {
            idName = 'packageId';
        } else {
            idName = 'id';
        }
        self.items.forEach(function(item, index) {
            database
            .getImg(self.type, item[idName])
            .success(function(img) {
                self.itemImgs[item[idName]] = img.base64;
            })
            .error(function() {
                //TODO
            });
        });
    }

    function refreshTags() {
        if ($.isEmptyObject(self.selected)) {
            getUnselected();
        } else {
            var ids = self.items.map(function(item) {
                if (self.type === 'package') {
                    return item.packageId;
                } else {
                    return item.id;
                }
            });
            database
            .getTagsWithIds(self.type, ids, self.selected)
            .success(function(res) {
                self.unselected = res;
            })
            .error(function() {
                //TODO
            });
        }
    }

    function buildModal() {
        $ionicModal.fromTemplateUrl('templates/local-tags.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            self.tagModal = modal;
        });
    }

    function getUnselected() {
        database
        .getAllTags(self.type, [])
        .success(function(tags) {
            self.unselected = tags;
        })
        .error(function(e) {
            //TODO
        });
    }
}
}());
