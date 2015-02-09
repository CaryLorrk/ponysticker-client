(function () {
angular
.module('ponysticker.tags')
.controller('TagsController', TagsController);

function TagsController($ionicPopup, $translate, database, type, id) {
    var self = this;

    self.type = type;
    self.id = id;
    self.unselected = [];
    self.selected = [];
    self.query = '';

    self.addTag = addTag;
    self.deleteTag = deleteTag;
    self.addTagDirectly = addTagDirectly;
    self.addTagInField= addTagInField;

    init();

    function addTag(tag) {
        database
        .addTag(tag, self.type, self.id)
        .success(function() {
            var idx = self.unselected.indexOf(tag);
            self.selected.push(tag);
            self.unselected.splice(idx, 1);
        })
        .error(function() {
            //TODO
        });
    }

    function deleteTag(tag) {
        database
        .deleteTag(tag, self.type, self.id) 
        .success(function() {
            var idx = self.selected.indexOf(tag);
            self.unselected.push(tag);
            self.selected.splice(idx, 1);
        })
        .error(function() {
            //TODO
        });
    }

    function addTagDirectly() {
        if (!self.query ||
            self.selected.indexOf(self.query) >= 0) {
            return;
        }

        database
        .addTag(self.query, self.type, self.id)
        .success(function() {
            self.selected.push(self.query);
            var idx = self.unselected.indexOf(self.query);
            if (idx >= 0) {
                self.unselected.splice(idx, 1);
            }
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
        getSelected();
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
