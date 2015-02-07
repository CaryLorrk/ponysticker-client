(function () {
angular
.module('ponysticker')
.controller('MenuController', MenuController);

function MenuController() {
    var self = this;

    self.submenu = '';
    self.toggleSubmenu = toggleSubmenu;
    self.showSubmenu = showSubmenu;

    function toggleSubmenu(submenu) {
        if (self.submenu !== submenu) {
            self.submenu = submenu;
        } else {
            self.submenu = '';
        }
    }

    function showSubmenu(submenu) {
        return self.submenu === submenu;
    }

}
}());
