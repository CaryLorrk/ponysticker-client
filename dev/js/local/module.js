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
    });

}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('local');
    $translate.refresh();
}
}());
