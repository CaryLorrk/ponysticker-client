(function () {
angular
.module('ponysticker.local')
.controller('LocalController', LocalController);

function LocalController(database, type) {
    var self = this;
    self.type = type;
    self.selected = {};
    self.unselected = {};
    self.getKeys = getKeys;
    self.showTagModal = showTagModal;
    
    init();

    function showTagModal() {

    }

    function getKeys(obj) {
        return Object.keys(obj);
    }

    function init() {
        getUnselected();
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
