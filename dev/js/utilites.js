var PonyModule = (function (m) {
    m.isPositiveInteger = isPositiveInteger;
    m.resolveParamFactory = resolveParamFactory;
    m.objSize = objSize;
    
    init();

    function resolveParamFactory(param) {
        var resolveFunc = function ($stateParams) {
            return $stateParams[param];
        };
        resolveFunc.$inject = ['$stateParams'];

        return resolveFunc;

    }

    function isPositiveInteger(input) {
        return !(!input || input <= 0 || input % 1);
    }

    function objSize(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)){
                size++;
            }
        }
        return size;
    }

    function init() {
        checkBrowser();
    }

    function checkBrowser() {
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        var isChrome = !!window.chrome && !m.isOpera;              // Chrome 1+
        var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

        m.isOpera = function(){return isOpera;}
        m.isFirefox = function(){return isFirefox;}
        m.isSafari = function(){return isSafari;}
        m.isChrome = function(){return isChrome;}
        m.isIE = function(){return isIE;}
    }

    return m;
}({}));
