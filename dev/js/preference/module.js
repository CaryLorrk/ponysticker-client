(function () {
angular
.module('ponysticker.preference', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('preference', {
        url: '/preference',
        templateUrl: 'templates/preference.html',
        controller: 'PreferenceController as preference'
    });
}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('preference');
    $translate.refresh();
}
}());
