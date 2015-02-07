(function () {
angular
.module('ponysticker',[
    'ionic',
    'pascalprecht.translate',
    'ponysticker.utilites',
    'ponysticker.package',
    'ponysticker.download',
    'ponysticker.preference'
])
.config(config)
.run(run);

function config($translateProvider, $translatePartialLoaderProvider) {
    $translatePartialLoaderProvider.addPart('menu');
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
