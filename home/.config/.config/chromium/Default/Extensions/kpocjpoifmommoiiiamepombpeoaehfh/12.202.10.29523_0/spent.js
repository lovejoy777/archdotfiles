var _unifiedLogging = (function() {
    var    APPLICATION_NAME = 'CAPSearch';

    function getTrackId(){
        var trackId = "";
        var pf = new PartnerIdFactory(),
            parentPartnerId = pf.parse(Global.getPartnerId());

            if (parentPartnerId.isValid()) {
                trackId = parentPartnerId.getTrack();
            }

        
        return trackId;
    }

    function getToolbarConfig(){
        var domBackgroundPage = chrome.extension.getBackgroundPage(); 
        return domBackgroundPage.config;
    }

    function getANX_URL(){
        return Common.unifiedLoggingPixelUrl;
    }
    function hasPartner(){
        var pf = new PartnerIdFactory(),
            parentPartnerId = pf.parse(Global.getPartnerId());

        return parentPartnerId.isValid() == true;
    }

    
    
    


    

    return {
        EVENTS: {
            TABPAGEVIEW: 'TabPageView',
            UICONTROL: 'UIControl'
        },
        //proposed interim solution to UL delay, would prefer to build true message queue in Widget API 2.0
        deferUl: function(){
            var a,g,t,p,loaded;
            a=getANX_URL();
            g=getToolbarConfig();
            t=getTrackId();
            p=hasPartner();


            loaded= (a && g && p);

            if(loaded){
                _unifiedLogging.logEvent(_unifiedLogging.EVENTS.TABPAGEVIEW, {controlID: "chrome-orig"});
                console.log('FIRE 1');
            } else {
                /*console.log('spent: deferUl failed');
                console.log('spent: a=%O', a);
                console.log('spent: g=%O', g);
                console.log('spent: p=%O', p);*/
                setTimeout(_unifiedLogging.deferUl, 250);
            }
        },

        
        logEvent: function(eventType, appSpecificParams) {
            var params = {
                anxa: APPLICATION_NAME,
                anxv: getToolbarConfig().version,
                anxd: getToolbarConfig().buildDate,
                userSeg: getTrackId(),
                userSegType: "ndl",
                anxe: eventType,
                anxr: Common.randomInt()
            };

            Common.extend(params, appSpecificParams);
            var qs = getANX_URL() + "?" + Common.makeQueryString(params);
            Common.getExternalData(qs);
            console.log('constructed URL');
            console.log(qs);
            console.dir(params);

        },

        logClick: function(controlID) {
            this.logEvent(this.EVENTS.UICONTROL, {
                controlID: controlID,
                uitype: "link",
                controlGroupID: "tab"
            });
        }
    };
})();


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

/*setTimeout(function(){
    _unifiedLogging.logEvent(_unifiedLogging.EVENTS.TABPAGEVIEW, {controlID: "chrome-orig"});
    console.log('FIRE 1');
},500);
console.log('spent Loaded');*/
_unifiedLogging.deferUl();