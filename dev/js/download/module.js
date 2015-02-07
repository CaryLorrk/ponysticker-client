(function () {
angular
.module('ponysticker.download', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('download', {
        url: '/download/:repo',
        templateUrl: 'templates/download.html',
        controller: 'DownloadController as download',
        resolve: {
            repo: PonyModule.resolveParamFactory('repo')
        }
    });
}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('download');
    $translate.refresh();
}
}());
