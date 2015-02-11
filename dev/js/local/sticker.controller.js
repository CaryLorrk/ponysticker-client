(function () {
angular
.module('ponysticker.local')
.controller('LocalStickerController', LocalStickerController);

function LocalStickerController(stickerActionSheet) {
    var self = this;

    self.showActionSheet = showActionSheet;

    function showActionSheet(sticker, imgBase64) {
        stickerActionSheet(sticker.id, true, imgBase64);
    }
}
}());
