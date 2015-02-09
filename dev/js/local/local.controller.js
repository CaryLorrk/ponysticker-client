(function () {
angular
.module('ponysticker.local')
.controller('LocalController', LocalController);

function LocalController(database, type) {
    var self = this;
    self.type = type;
    self.selected = [];
    self.unselected = [];
    
    self.items = [1,2,3,4];

    init();

    function init() {
        getUnselected();
    }

    function getUnselected() {
        database
        .getFilteredTags(self.type, [])
        .success(function(tags) {
            self.unselected = tags;
        })
        .error(function(e) {
            //TODO
        });
    }
}
}());
