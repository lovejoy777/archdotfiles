function _resizeSearch() {
    console.log('s: _resizeSearch()');
    /*
    var curWidth = $('#searchfor').outerWidth(),
        newWidth = Math.floor($("search-box").width() - $("#submitSearch").outerWidth() - 1);
    console.log('curWidth: %s, newWidth: %s', curWidth, newWidth);
    $("#searchfor").add($("#sgbody")).width(newWidth);
    */
    $("#searchfor").add($("#sgbody")).outerWidth(Math.floor($("search-box").width() - $("#submitSearch").outerWidth() - 1));

}
function _resize() {
    console.log('s: _resize()');
    var e = $(window).height() - $(".footer").height(),
        t = (e - $(".searchContainer").outerHeight(!0) - $(".widgetContainer").outerHeight(!0)) / 2;
    t = t > 0 ? t : 0;
    $(".containerWrapper").css({"padding-top": t + "px","padding-bottom": t + "px"});
    _resizeSearch();
}
$(window).resize(function() {
    _resize();
});
_resize();