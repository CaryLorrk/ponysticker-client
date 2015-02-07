(function () {
angular
.module('ponysticker.download')
.controller('DownloadController', DownloadController);

function DownloadController($scope, $state,
                            $ionicScrollDelegate, $ionicPopup, $ionicPopover,
                            $translate, preference, serverAPI, repo) {
    var self = this;
    self.repo = repo;
    self.order = preference.getOrder();
    self.pkgCount = 0;
    self.page = 1;
    self.pkgList = [];
    self.query = '';

    self.getPageCount = getPageCount;
    self.search = search;
    self.getTabOnUrl = serverAPI.getTabOnUrl;
    self.getTitle = getTitle;
    self.getAuthor = getAuthor;
    self.goPrev = goPrev;
    self.goNext = goNext;
    self.searchInField = searchInField;
    self.showPageEditor = showPageEditor;
    self.showSortPopover = showSortPopover;
    self.refreshAll = refreshAll;
    self.isLoading = isLoading;
    self.isLoadingErr = isLoadingErr;

    init();

    function isLoading () {
        return self.isListLoading || self.isCountLoading;
    }

    function isLoadingErr() {
        return self.loadingListErr || self.loadingCountErr;
    }

    function showSortPopover($event) {
        self.sortPopover.show($event);
    }

    function showPageEditor() {
        self.pageEditor = {
            newPage: self.page,
            isPositiveInteger: isPositiveInteger,
            isInRange: isInRange,
            applyNewPage: applyNewPage
        };

        $translate([
            'DOWNLOAD_PAGE_TITLE',
            'DOWNLOAD_PAGE_ALERT',
            'DOWNLOAD_CANCEL',
            'DOWNLOAD_OK'])
        .then(showPopup);

        function showPopup(trans) {
            var popup = $ionicPopup.show({
                title: trans.DOWNLOAD_PAGE_TITLE,
                templateUrl: 'templates/download-page-editor.html',
                scope: $scope,
                buttons: [
                    {text: trans.DOWNLOAD_CANCEL},
                    {
                        text: trans.DOWNLOAD_OK,
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!isLegal()) {
                                e.preventDefault();
                            } else {
                                return true;
                            }
                        }
                    }
                ]

            });
            popup.then(function(res) {
                if (res) {
                    applyNewPage();
                }
            }); 

            self.pageEditor.closeInField = function($event) {
                if ($event.keyCode === 13 && isLegal()) {
                    applyNewPage();
                    popup.close();
                }
            };
        }

        function isPositiveInteger() {
            return PonyModule.isPositiveInteger(self.pageEditor.newPage);
        }

        function isInRange() {
            return self.pageEditor.newPage < self.getPageCount();
        }

        function isLegal() {
            return isPositiveInteger() && isInRange();
        }

        function applyNewPage() {
            self.page = self.pageEditor.newPage;
            refreshPkgList();
        }

    }

    function getPageCount() {
        return Math.ceil(self.pkgCount / preference.getPageSize());
    }

    function search() {
        self.page = 1;
        refreshPkgCount();
        refreshPkgList();
    }

    function searchInField($event) {
        if ($event.keyCode === 13) {
            search();
        }
    }

    function getTitle(pkg) {
        var title = pkg.title[preference.getLanguage()];
        if (!title) {
            title = pkg.title['en'];
        }
        
        return title;
    }

    function getAuthor(pkg) {
        var author = pkg.author[preference.getLanguage()];
        if (!author) {
            author = pkg.author['en'];
        }
        
        return author;
    }

    function goPrev() {
        self.page -= 1;
        if (self.page <= 0) {
            self.page = getPageCount();
        }

        refreshPkgList();
    }

    function goNext() {
        self.page += 1;
        if (self.page > getPageCount()) {
            self.page = 1;
        }
        refreshPkgList();
    }

    function init() {
        refreshAll();
        buildSortPopover();
        watchOrder();
    }

    function buildSortPopover() {
        $ionicPopover.fromTemplateUrl(
            'templates/download-sort-popover.html', {
            scope: $scope,
        }).then(function(popover) {
            self.sortPopover = popover;
        });
    }

    function watchOrder() {
        $scope.$watch(function() {
            return self.order;
        }, function(value) {
            preference.setOrder(value);
            self.page = 1;
            refreshPkgList();
        });
    }

    function refreshPkgList() {
        self.pkgList = [];
        self.isListLoading = true;
        serverAPI
        .getPkgList(self.repo, self.page,
                    preference.getPageSize(),
                    self.order,
                    self.query)
        .success(function(data) {
            self.isListLoading = false;
            self.loadingListErr = false;
            self.pkgList = data;
            $ionicScrollDelegate.scrollTop();
        })
        .error(function() {
            self.isListLoading = false;
            self.loadingListErr = true;
        });
    }

    function refreshPkgCount() {
        self.isCountLoading = true;
        serverAPI
        .getPkgCount(self.repo, self.query)
        .success(function(data) {
            self.isCountLoading = false;
            self.loadingCountErr = false;
            self.pkgCount = data;
        })
        .error(function() {
            self.isCountLoading = false;
            self.loadingCountErr = true;
        });
    }

    function refreshAll() {
        refreshPkgCount();
        refreshPkgList();
    }
}
}());
