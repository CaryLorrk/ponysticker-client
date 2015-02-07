(function () {
angular
.module('ponysticker.utilites')
.directive('slideToggle', slideToggle);
function slideToggle() {
    return {
        restrict: 'A',      
        scope:{
            isOpen: '=slideToggle'
        },  
        link: function(scope, element, attr) {
            var slideDuration = parseInt(attr.slideToggleDuration, 10) || 400;      

            scope.$watch('isOpen', function(newIsOpenVal, oldIsOpenVal){
                if(newIsOpenVal !== oldIsOpenVal){ 
                    element.stop().slideToggle(slideDuration);
                }
            });
        }
    };  
}
}());
