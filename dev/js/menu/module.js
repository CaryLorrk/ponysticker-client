(function () {
angular
.module('ponysticker.menu', [])
.run(run);

function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('menu');
    $translate.refresh();
}
}());
