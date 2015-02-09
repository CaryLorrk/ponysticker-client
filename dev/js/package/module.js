(function () {
angular
.module('ponysticker.package', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('package', {
        url: '/package/:repo/:packageId',
        templateUrl: 'templates/package.html',
        controller: 'PackageController as package',
        resolve: {
            repo: PonyModule.resolveParamFactory('repo'),
            packageId: PonyModule.resolveIntParamFactory('packageId')
            
        }
    });
}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('package');
    $translate.refresh();
}
}());
