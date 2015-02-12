var PonyModule = (function () {
    var m = {};
    m.isPositiveInteger = isPositiveInteger;
    m.resolveParamFactory = resolveParamFactory;
    m.resolveIntParamFactory = resolveIntParamFactory;
    m.objSize = objSize;
    m.objIntersection = objIntersection;
    m.objUnionInPlace = objUnionInPlace;

    window.onload = function() {
        m.saveData = (function () {
            var a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            return function (data, fileName) {
                console.log(data);
                var json = JSON.stringify(data),
                blob = new Blob([json], {type: 'octet/stream'}),
                url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
    };

    init();

    return m;

    function objIntersection(obj1, obj2) {
        var obj = {};
        for(var key in obj1) {
            if (obj1.hasOwnProperty(key)) {
                if (obj2.hasOwnProperty(key)) {
                    obj[key] = true;
                }
            }
        }
        return obj;
    }

    function objUnionInPlace(obj1, obj2) {
        for (var key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                obj1[key] = true;
            }
        }
        return obj1;
    }



    function resolveParamFactory(param) {
        var resolveFunc = function ($stateParams) {
            return $stateParams[param];
        };
        resolveFunc.$inject = ['$stateParams'];

        return resolveFunc;

    }

    function resolveIntParamFactory(param) {
        var resolveFunc = function ($stateParams) {
            return parseInt($stateParams[param]);
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

        m.isOpera = function(){return isOpera;};
        m.isFirefox = function(){return isFirefox;};
        m.isSafari = function(){return isSafari;};
        m.isChrome = function(){return isChrome;};
        m.isIE = function(){return isIE;};
    }
}());
