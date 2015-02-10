(function () {
angular
.module('ponysticker.favorite', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('favorite', {
        url: '/favorite/:type',
        templateUrl: 'templates/favorite.html',
        controller: 'FavoriteController as favorite',
        resolve: {
            type: PonyModule.resolveParamFactory('type')
        }
    })
    .state('favorite.package', {
        url: '/package',
        templateUrl: 'templates/favorite-package.html',
        controller: 'LocalPackageController as package'
    })
    .state('favorite.sticker', {
        url: '/sticker',
        templateUrl: 'templates/favorite-sticker.html',
        controller: 'LocalStickerController as stickerList'
    });
}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('favorite');
    $translate.refresh();
}
}());
