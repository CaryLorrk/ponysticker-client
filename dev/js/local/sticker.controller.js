(function () {
angular
.module('ponysticker.local')
.controller('LocalStickerController', LocalStickerController);

function LocalStickerController(stickerActionSheet) {
    var self = this;

    self.getStickerUrl = getStickerUrl;
    self.showActionSheet = showActionSheet;

    function showActionSheet(sticker) {
        stickerActionSheet(sticker.id, true);
    }

    function getStickerUrl(sticker) {
        return 'data:image/jpg;base64,'+sticker.base64;
    }
}
}());
