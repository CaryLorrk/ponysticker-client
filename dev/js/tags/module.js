(function () {
angular
.module('ponysticker.tags', [])
.config(config)
.run(run);

function config($stateProvider) {
    $stateProvider
    .state('tags', {
        url: '/tags/:type/:id',
        templateUrl: 'templates/tags.html',
        controller: 'TagsController as tags',
        resolve: {
            type: PonyModule.resolveParamFactory('type'),
            id: PonyModule.resolveIntParamFactory('id')
        }
    });
}

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('tags');
    $translate.refresh();
}

}());
