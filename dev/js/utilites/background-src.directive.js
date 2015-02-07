(function () {
angular
.module('ponysticker.utilites')
.directive('backgroundSrc', backgroundSrc);

function backgroundSrc() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            attrs.$observe('backgroundSrc', function(url) {
                element.css({
                    'background-image': 'url("'+url+'")'
                });
            });
        }
    };
}
}());
