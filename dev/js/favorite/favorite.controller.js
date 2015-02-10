(function () {
angular
.module('ponysticker.favorite')
.controller('FavoriteController', FavoriteController);

function FavoriteController($scope, database, preference, type) {
    var self = this;

    self.page = 1;
    self.pageSize = preference.getPageSize();
    self.type = type;
    self.hasNext = false;
    self.items = [];

    self.goPrev = goPrev;
    self.goNext = goNext;

    init();

    function goPrev() {
        self.page -= 1;
        refreshItems();
    }

    function goNext() {
        self.page += 1;
        refreshItems();
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
            self.items = res[0];
            self.hasNext = res[1];
            
        })
        .error(function() {
            //TODO
        });
    }

}
}());
