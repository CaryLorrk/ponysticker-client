(function () {
angular
.module('ponysticker',[
    'ionic',
    'pascalprecht.translate',
    'ponysticker.utilites',
    'ponysticker.menu',
    'ponysticker.local',
    'ponysticker.package',
    'ponysticker.download',
    'ponysticker.tags',
    'ponysticker.preference'
])
.config(config)
.run(run);

function config($ionicConfigProvider, $translateProvider) {
    $ionicConfigProvider.views.transition('none');
    $translateProvider.useLoader('$translatePartialLoader', {
        urlTemplate: 'i18n/{part}/{lang}.json'
    });

}

function run($ionicPlatform, $translate, preference, database) {
    $ionicPlatform.ready(function() {
        database.init();
    });
    $translate.use(preference.getLanguage());
}
}());
