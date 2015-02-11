(function () {
angular
.module('ponysticker.menu')
.controller('MenuController', MenuController);

function MenuController() {
    var self = this;

    self.submenu = '';
    self.toggleSubmenu = toggleSubmenu;
    self.showSubmenu = showSubmenu;
    self.exitApp = exitApp;
    self.isWebView = ionic.Platform.isWebView;

    function exitApp() {
        window.close();
        ionic.Platform.exitApp();
    }

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
