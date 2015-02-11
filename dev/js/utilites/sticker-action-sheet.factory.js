(function () {
angular
.module('ponysticker.utilites')
.factory('stickerActionSheet', stickerActionSheet);

function stickerActionSheet($rootScope, $ionicActionSheet, $state, $translate, database) {
    return function showActionSheet(sticker, jump, imgBase64) {
        $translate([
            'UTILITES_SET_TAGS',
            'UTILITES_CANCEL',
            'UTILITES_SHARE_STICKER',
            'UTILITES_ADD_FAVORITE',
            'UTILITES_REMOVE_FAVORITE',
            'UTILITES_JUMP_TO_PACKAGE'
        ])
        .then(function(trans) {
            database
            .getMeta('sticker', sticker)
            .success(function(res) {
                var meta = res;
                var buttons = [];
                buttons.push({text: trans.UTILITES_SHARE_STICKER});
                if (meta) {
                    if (meta.star) {
                        buttons.push({text: trans.UTILITES_REMOVE_FAVORITE});
                    } else {
                        buttons.push({text: trans.UTILITES_ADD_FAVORITE});
                    }
                    buttons.push({text: trans.UTILITES_SET_TAGS});
                    if (jump) {
                        buttons.push({text: trans.UTILITES_JUMP_TO_PACKAGE});
                    }
                }
                $ionicActionSheet.show({
                    buttons: buttons,
                    cancelText: trans.UTILITES_CANCEL,
                    buttonClicked: function(index) {
                        switch(index) {
                            case 0:
                                actionSheetShare(meta, imgBase64);
                                break;
                            case 1:
                                actionSheetFavorite(meta);
                                break;
                            case 2:
                                actionSheetSetTags(meta);
                                break;
                            case 3:
                                actionSheetJumpToPackage(meta);
                        }
                        return true;
                    },
                });
            })
            .error(function() {
                //TODO
            });
        });
    };

    function actionSheetShare(meta, imgBase64) {
        if (meta) {
            meta.recent = Date.now();
            database
            .updateMeta('sticker', meta);
        }
        if ($rootScope.intentType === 'main') {
            window.PonyPlugin.shareWithBase64(imgBase64);
        } else if ($rootScope.intentType === 'browser') {

        } else {
            window.PonyPlugin.setResultWithBase64(imgBase64);
        }
    }

    function actionSheetFavorite(meta) {
        if (meta.star === 0) {
            meta.star = 1;
        } else {
            meta.star = 0;
        }
        database
        .updateMeta('sticker', meta)
        .error(function() {
            //TODO
        });
    }

    function actionSheetSetTags(meta) {
        $state.go('tags', {
            type:'sticker',
            id: meta.id});
    }

    function actionSheetJumpToPackage(meta) {
        $state.go('package', {
            repo: 'local',
            packageId: meta.packageId
        });
    }
}
}());
