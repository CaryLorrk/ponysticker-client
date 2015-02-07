(function () {
angular
.module('ponysticker.utilites')
.directive('touchActive', touchActive);

function touchActive() {
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.bind('touchstart', function() {
                element.addClass('touch-active');
            });

            element.bind('touchend', function() {
                element.removeClass('touch-active');
            });
        }

    };
}
}());
