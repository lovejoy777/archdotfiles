/**
 * Created by steven.harris on 3/20/2014.
 */

var Mindspark_competitorDnsList = (function(){
    "use strict";

    var console = {},
		competitorDnsData,
		localStorageMechanism = {
			getValue: function(key) {

			},
			setValue: function(key, value) {

			},
			removeValue: function(key) {

			}
		},
        GLOBAL_CDNS_KEY = 'competitorDNS',
        DEFAULT_LIST = [],
        initialize = function(_console, _localStorageMechanism){
            console = _console;
            localStorageMechanism = _localStorageMechanism;
        },
        getList = function(callback){
//            console.log('cDL: getList(%O)', callback);
            var data = getDataFromLocalStorage();
            if (!data){
//                console.log('cDL: getList - !data');
                getDataFromAkamai(function(data){
                    if (data){
                        competitorDnsData = data;
                        putDataIntoLocalStorage();
                    }else{
                        competitorDnsData = {list: DEFAULT_LIST};
                    }
                    console.log('cDL: getList - data from akamai: %O, passing %O to callback', data, competitorDnsData.list);
                    callback(competitorDnsData.list);
                });
            }else{
                console.log('cDL: getList - data: %O, passing %O to callback', data, data.list);
                callback(data.list);
            }
        },
        clearList = function(){
            competitorDnsData = undefined;
            putDataIntoLocalStorage();
        },
        isDataStale = function(){
            return !competitorDnsData || competitorDnsData.expires && competitorDnsData.expires > new Date().getTime();
        },
        getDataFromLocalStorage = function(){
            if (!competitorDnsData){
                var savedData = localStorageMechanism.getValue(GLOBAL_CDNS_KEY);
                if (savedData && savedData !== 'undefined'){
                    competitorDnsData = JSON.parse(savedData);
                }
                if (isDataStale()){
                    competitorDnsData = undefined;
                }
            }
            console.log('cDL: getDataFromLocalStorage - returns: %O', competitorDnsData);
            return competitorDnsData;
        },
        putDataIntoLocalStorage = function(){
            if (competitorDnsData){
				localStorageMechanism.setValue(GLOBAL_CDNS_KEY, JSON.stringify(competitorDnsData));
            }else{
                localStorageMechanism.removeValue(GLOBAL_CDNS_KEY);
            }
        },
        getDataFromAkamai = function(callback){
            console.log('cDL: getDataFromAkamai(%O)', callback);
            var AKAMAI_URL = 'http://ak.imgfarm.com/images/nocache/native/cDNS.json',
                DEFAULT_REFRESH_PERIOD = 7*24*60*60*1000 /* 1 week */;

            Mindspark_.adapterUtil.sendAjaxRequest(
                {
                    'url': AKAMAI_URL
                },
                function(response) {
                    if (!response.error) {
                        var content = response.content;

                        console.log('cDL: getDataFromAkamai - content: %O', content);
                        try {
                            var parsedData = JSON.parse(content);
                            var refreshPeriod = parsedData.refreshPeriod || DEFAULT_REFRESH_PERIOD;
                            parsedData.expires = new Date().getTime() + refreshPeriod;
                            parsedData.retrieveDateStr = String(new Date());
                            console.log('cDL: getDataFromAkamai - parsedData: %O', parsedData);
                            callback(parsedData);
                        } catch (e) {
                            console.warn('cDL: Unable to parse cDNS response, caught: %O', e);
                            callback(undefined);
                        }
                    }else{
                        console.warn('cDL: error: %s', response.error);
                        callback(undefined);
                    }
                }
            );
        },
        that = {
            initialize: initialize,
            getList: getList,
            clearList: clearList
        };
    return that;
})();
