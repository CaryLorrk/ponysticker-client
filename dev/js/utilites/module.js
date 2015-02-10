(function () {
angular
.module('ponysticker.utilites', [])
.run(run);
function run($translate, $translatePartialLoader) {
    $translatePartialLoader.addPart('utilites');
    $translate.refresh();
}
}());
