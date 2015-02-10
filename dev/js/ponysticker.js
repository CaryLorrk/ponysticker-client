(function () {
angular
.module('ponysticker',[
    'ionic',
    'pascalprecht.translate',
    'ponysticker.utilites',
    'ponysticker.menu',
    'ponysticker.favorite',
    'ponysticker.local',
    'ponysticker.package',
    'ponysticker.download',
    'ponysticker.tags',
    'ponysticker.preference'
])
.config(config)
.run(run);

function config($ionicConfigProvider, $translateProvider, $urlRouterProvider) {
    $ionicConfigProvider.views.transition('none');
    $translateProvider.useLoader('$translatePartialLoader', {
        urlTemplate: 'i18n/{part}/{lang}.json'
    });

    $urlRouterProvider
    .when('/local/package', '/local/package/package')
    .when('/local/sticker', '/local/sticker/sticker')
    .when('/favorite/package', '/favorite/package/package')
    .when('/favorite/sticker', '/favorite/sticker/sticker')
    .otherwise('/local/sticker/sticker');

}

function run($ionicPlatform, $translate, preference, database) {
    $ionicPlatform.ready(function() {
        database.init();
    });
    $translate.use(preference.getLanguage());
}
}());
