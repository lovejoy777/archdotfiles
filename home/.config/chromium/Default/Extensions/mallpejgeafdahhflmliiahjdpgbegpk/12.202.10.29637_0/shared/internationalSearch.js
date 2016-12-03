/**
 * Created by steven.harris on 4/13/2015.
 */

var Mindspark_InternationalSearch = (function(){
    var DEFAULT_COUNTRY_CODE = '99',
        initialState = function initialState(){
            return {
                countryCode: undefined,
                defaultDomain: undefined,
                originalDomain: undefined,
                specifiedDomain: undefined,
                countryCodes: [],
                useDomain: undefined
            };
        },
        state = initialState(),
        reset = function reset(){
            state = initialState();
        },
        knownCountry = function knownCountry(){
            return state.countryCodes.indexOf(state.countryCode || '') !== -1;
        },
        setCountryCode = function setCountryCode(countryCode/*, ...*/){
            var cur, cc = DEFAULT_COUNTRY_CODE;
            for (var i = 0, len = arguments.length; i < len; ++i){
                cur = arguments[i] || DEFAULT_COUNTRY_CODE;
                if (cur !== DEFAULT_COUNTRY_CODE){
                    cc = cur;
                    break;
                }
            }
            state.countryCode = cc.toUpperCase();
            state.useDomain = undefined;
        },
        getCountryCode = function getCountryCode(){
            return state.countryCode;
        },
        normalizeDomain = function normalizeDomain(domain){
            var url = domain ? new Mindspark_HttpURL(domain) : undefined;
            if (url){
                url.setPath('');
            }
            return url;
        },
        setDefaultDomain = function setDefaultDomain(defDomain){
            state.defaultDomain = normalizeDomain(defDomain);
            state.useDomain = undefined;
        },
        getDefaultDomain = function getDefaultDomain(){
            return state.defaultDomain;
        },
        setOriginalDomain = function setOriginalDomain(originalDomain){
            state.originalDomain = normalizeDomain(originalDomain);
            state.useDomain = undefined;
        },
        getOriginalDomain = function getOriginalDomain(){
            return state.originalDomain;
        },
        setSpecifiedDomain = function setSpecifiedDomain(specifiedDomain){
            state.specifiedDomain = normalizeDomain(specifiedDomain);
            state.useDomain = undefined;
        },
        getSpecifiedDomain = function getSpecifiedDomain(){
            return state.specifiedDomain;
        },
        setCountryCodes = function setCountryCodes(countryCodes){
            state.countryCodes = countryCodes || [];
            for (var i = 0, len = state.countryCodes.length; i < len; ++i){
                state.countryCodes[i] = state.countryCodes[i].toUpperCase();
            }
            state.useDomain = undefined;
        },
        getCountryCodes = function getCountryCodes(){
            return state.countryCodes.slice(0);
        },
        isEnabled = function(){
            // spec states that defaultDomain must be set (not 'none')
            return !!state.defaultDomain;
        },
        getDomainForCountry = function(){
            return knownCountry() ? state.specifiedDomain : state.defaultDomain;
        },
        getSearchDomain = function getSearchDomain(){
            if (!state.useDomain){
                state.useDomain = isEnabled() ? getDomainForCountry() : state.originalDomain;
            }
            return state.useDomain;
        },
        adjustDomain = function adjustDomain(urlIn){
            var url = new Mindspark_HttpURL(urlIn),
                useDomain = getSearchDomain();

            if (state.originalDomain && url.getDomain() === state.originalDomain.getDomain()){
                url.setScheme(useDomain.getScheme());
                url.setDomain(useDomain.getDomain());
            }
            return url.toString();
        },
        toString = function toString(){
            return ["InternationalSearch{",
                "countryCode:", state.countryCode, ',',
                "default:", state.defaultDomain, ',',
                "original:", state.originalDomain, ',',
                "specified:", state.specifiedDomain, ',',
                "countryCodes:[", state.countryCodes.join(','), '],',
                "use:", getSearchDomain(),
                "}"].join('');
        },
        that = {
            setCountryCode: setCountryCode,
            getCountryCode: getCountryCode,
            setDefaultDomain: setDefaultDomain,
            getDefaultDomain: getDefaultDomain,
            setOriginalDomain: setOriginalDomain,
            getOriginalDomain: getOriginalDomain,
            setSpecifiedDomain: setSpecifiedDomain,
            getSpecifiedDomain: getSpecifiedDomain,
            setCountryCodes: setCountryCodes,
            getCountryCodes: getCountryCodes,
            getSearchDomain: getSearchDomain,
            adjustDomain: adjustDomain,
            reset: reset,
            DEFAULT_COUNTRY_CODE: DEFAULT_COUNTRY_CODE,
            toString: toString
        };

    return that;
})();

(function(runTests){
    var console = window.console || Mindspark_console;
    Mindspark_InternationalSearch.unitTests = function unitTests() {
        var sd = Mindspark_InternationalSearch;

        console.log('Mindspark_InternationalSearch unit tests - STARTING\n\n');

        function test(bean, value) {
            var values = Array.prototype.slice.call(arguments, 1);
            try {
                if (!bean) {
                    console.log('Bean not provided');
                } else if (!sd['set' + bean]) {
                    console.error('Bean: %s -- not found', bean);
                    return;
                } else if (values.length === 1){
                    console.log('Bean: %s, value: %s', bean, Object.prototype.toString.call(value) == '[object Array]' ? '[' + value.join(',') + ']' : String(value));
                    sd['set' + bean](value);
                } else {
                    console.log('Bean: %s, values: %s', bean, String(values));
                    sd['set' + bean].apply(this, values);
                }
            } catch (e) {
                console.error(e);
            }
            console.log('\tcurrentState: %s', sd.toString());
            console.log('\t%s', sd.adjustDomain('http://www.hello.com/?u=http://search.mywebsearch.com'));
            console.log('\t%s', sd.adjustDomain('http://search.mywebsearch.com/?u=http://search.mywebsearch.com'));
            console.log('\t%s', sd.adjustDomain('http://search.mywebsearch.com/mywebsearch/GGmain.jhtml?${partnerParamsSearch}&ptb=${toolbarID}&ind=${installDate}&n=${installDateHex}&st=bar&searchfor=<!-- MY_TEXT_INPUT -->'));
            console.log('\t%s', sd.adjustDomain('http://search.myway.com/?u=http://search.mywebsearch.com'));
            console.log('Done\n\n');
        }

        console.log('resetting InternationalSearch');
        sd.reset();
        test();
        test('OriginalDomain', 'http://search.mywebsearch.com');
        test('DefaultDomain', 'http://us.search.mywebsearch.com');
        test('SpecifiedDomain', 'http://int.search.mywebsearch.com');
        test('CountryCodes', ["FR", "DE", "AE", "AD"]);
        test('CountryCode', undefined);
        test('CountryCode', undefined, 'US');
        test('CountryCode', '99', 'US');
        test('CountryCode', 'fr', 'ca');
        test('DefaultDomain', undefined);

        console.log('\nMindspark_InternationalSearch unit tests - COMPLETED\n\n');
    };
    if (runTests){
        Mindspark_InternationalSearch.unitTests();
    }
})(false);
