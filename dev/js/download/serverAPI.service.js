(function () {
angular
.module('ponysticker.download')
.service('serverAPI', serverAPI);

function serverAPI($http, preference) {
    var self = this;
    
    self.getMeta = getMeta;
    self.getTabOnUrl = getTabOnUrl;
    self.getTabOffUrl = getTabOffUrl;
    self.getStickerBase64 = getStickerBase64;
    self.getPkgCount = getPkgCount;
    self.getPkgList = getPkgList;

    function getStickerBase64(pkg, sticker) {
        return $http.get(concatUrl('sticker'), {
            params: {
                pkg: pkg,
                sticker: sticker,
                base64: '1'
            }
        });
    }

    function getMeta(repo, pkg) {
        return $http.get(concatUrl('meta'), {
            params: {
                repo: repo,
                pkg: pkg
            }
        });
    }

    function getTabOnUrl(pkg) {
        return concatUrl('sticker') + '?' + $.param([
            {name: 'pkg', value: pkg},
            {name: 'sticker', value: 'tab_on'}]);
    }

    function getTabOffUrl(pkg) {
        return concatUrl('sticker') + '?' + $.param([
            {name: 'pkg', value: pkg},
            {name: 'sticker', value: 'tab_off'}]);
    }

    function getStickerKeyUrl(pkg, sticker) {
        return concatUrl('sticker') + '?' + $.param([
            {name: 'pkg', value: pkg},
            {name: 'sticker', value: sticker+'_key'}
        ]);
    }

    function getPkgCount(repo, query) {
        return $http.get(concatUrl('pkg-count'), {
            params: {
                repo: repo,
                q: query
            }
        });
    }

    function getPkgList(repo, page, size, order, query) {
        return $http.get(concatUrl('pkg-list'), {
            params: {
                repo: repo,
                page: page,
                size: size,
                order: order,
                q: query
            }
        });
    }

    function concatUrl(concat) {
        var url = preference.getServer();
        if (url.slice(-1) !== '/') {
            return url + '/' + concat;
        } else {
            return url + concat;
        }
    }
}

}());
