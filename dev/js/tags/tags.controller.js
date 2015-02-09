(function () {
angular
.module('ponysticker.tags')
.controller('TagsController', TagsController);

function TagsController($ionicPopup, $translate, database, type, id) {
    var self = this;

    self.type = type;
    self.id = id;
    self.unselected = {};
    self.selected = {};
    self.query = '';

    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.addTagDirectly = addTagDirectly;
    self.addTagInField= addTagInField;
    self.getKeys = getKeys;

    init();

    function getKeys(obj) {
        return Object.keys(obj);
    }

    function addTag(tag) {
        database
        .addTag(tag, self.type, self.id)
        .success(function() {
            delete self.unselected[tag];
            self.selected[tag] = true;
        })
        .error(function() {
            //TODO
        });
    }

    function deleteTag(tag) {
        database
        .deleteTag(tag, self.type, self.id) 
        .success(function() {
            delete self.selected[tag];
            self.unselected[tag] = true;
        })
        .error(function() {
            //TODO
        });
    }

    function addTagDirectly() {
        if (!self.query ||
            self.selected[self.query]) {
            return;
        }

        database
        .addTag(self.query, self.type, self.id)
        .success(function() {
            self.selected[self.query] = true;
            delete self.unselected[self.query];
            self.query = '';
        })
        .error(function() {
            //TODO
        });
    }

    function addTagInField($event) {
        if ($event.keyCode === 13) {
            addTagDirectly();
        }
    }

    function init() {
        database
        .getClassifiedTags(self.type, self.id)
        .success(function(res) {
            self.selected = res[0];
            self.unselected = res[1];
        })
        .error(function() {
            //TODO
        });
    }

    function getSelected() {
        database
        .getMeta(self.type, self.id)
        .success(function(meta) {
            self.selected = meta.tags;
            getUnselected();
        })
        .error(function() {
            //TODO
        });
    }

    function getUnselected() {
        database
        .getFilteredTags(self.type, self.selected)
        .success(function(tags) {
            self.unselected = tags;
        })
        .error(function(e) {
            //TODO
        });
    }
}
}());
