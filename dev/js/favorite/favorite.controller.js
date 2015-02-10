(function () {
angular
.module('ponysticker.favorite')
.controller('FavoriteController', FavoriteController);

function FavoriteController($scope, database, preference, type) {
    var self = this;

    self.page = 1;
    self.pageSize = preference.getPageSize();
    self.type = type;
    self.items = [];
    self.itemImgs = {};

    self.getItemImgUrl = getItemImgUrl;

    init();

    function getItemImgUrl(itemId) {
        if (!self.itemImgs[itemId]) {
            return '';
        }
        return 'data:image/jpg;base64,'+self.itemImgs[itemId];
    }

    function init() {
        refreshItems();
        $scope.$on('$ionicView.enter', enterCheck);
    }

    function enterCheck() {
        refreshItems();
    }

    function refreshItems() {
        database
        .getMetaPaginationByStar(self.type, self.page, self.pageSize)
        .success(function(res) {
            self.items = res;
            refreshItemImgs();
        })
        .error(function() {
            //TODO
        });
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

}
}());
