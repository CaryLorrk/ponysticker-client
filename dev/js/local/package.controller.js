(function () {
angular
.module('ponysticker.local')
.controller('LocalPackageController', LocalPackageController);

function LocalPackageController(preference) {
    var self = this;

    self.getTitle = getTitle;
    self.getAuthor = getAuthor;

    function getTitle(pkg) {
        return pkg.title[preference.getLanguage()] ||
            pkg.title['en'];
    }

    function getAuthor(pkg) {
        return pkg.author[preference.getLanguage()] ||
            pkg.title['en'];
    }
}
}());
