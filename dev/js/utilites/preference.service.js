(function () {
angular
.module('ponysticker.utilites')
.service('preference', preference);

function preference() {
    var self = this;

    self.setLanguage = setItemFactory('language');
    self.getLanguage = getItemFactory('language', 'en');
    self.setServer = setItemFactory('server');
    self.getServer = getItemFactory('server', 'http://1.34.244.41:50025');
    self.setPageSize = setItemFactory('pageSize');
    self.getPageSize = getItemFactory('pageSize', 12);
    self.setOrder = setItemFactory('order');
    self.getOrder = getItemFactory('order', 'packageId');
    self.setDatabaseVersion = setItemFactory('dbversion');
    self.getDatabaseVersion = getItemFactory('dbversion', 0);
    self.setDriveToken = setObjectItemFactory('driveToken');
    self.getDriveToken = getObjectItemFactory('driveToken', null);

    function getObjectItemFactory(item, defaultValue) {
        return function() {
            var value = JSON.parse(localStorage.getItem(item));
            if (!value) {
                value = defaultValue;
            }
            return value;
        };
    }

    function setObjectItemFactory(item) {
        return function(object)  {
            localStorage.setItem(item, JSON.stringify(object));
        };
    }

    function setItemFactory(item) {
        return function(value) {
            localStorage.setItem(item, value);
        };
    }

    function getItemFactory(item, defaultValue) {
        return function() {
            var value = localStorage.getItem(item);
            if (!value) {
                value = defaultValue;
            }
            return value;
        };
    }
}
}());
