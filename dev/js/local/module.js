(function () {
angular
.module('ponysticker.local', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('local', {
        url: '/local/:type',
        templateUrl: 'templates/local.html',
        controller: 'LocalController as local',
        resolve: {
            type: PonyModule.resolveParamFactory('type')
        }
    })
    .state('local.package', {
        url: '/package',
        templateUrl: 'templates/local-package.html',
        controller: 'LocalPackageController as package'
    })
    .state('local.sticker', {
        url: '/sticker',
        templateUrl: 'templates/local-sticker.html',
        controller: 'LocalStickerController as stickerList'
    });

}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('local');
    $translate.refresh();
}
}());
