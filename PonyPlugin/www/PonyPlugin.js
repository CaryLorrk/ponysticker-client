var exec = require('cordova/exec'),
    cordova = require('cordova');

function PonyPlugin() {
    this.init = 'yes';
}

PonyPlugin.prototype.available = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PonyPlugin', 'available', []);
};

PonyPlugin.prototype.checkIntent = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PonyPlugin', 'checkIntent', []);
};

PonyPlugin.prototype.setResultWithBase64 = function(imgBase64, successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PonyPlugin', 'setResultWithBase64', [imgBase64]);
};

PonyPlugin.prototype.shareWithBase64 = function(imgBase64, successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'PonyPlugin', 'shareWithBase64', [imgBase64]);
};

module.exports = new PonyPlugin();
