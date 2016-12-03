/*
 Publishes:
 - Sync
 - syncParentToolbarId
 Subscribes to:
 - firstKnownVersion
 - toolbarId
 */
(function(window, chrome) {

    function createGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    function createStub(context) {
        return function StubFunc() {
            console.debug('cS: context: %s, arguments: %O', context, arguments);
        };
    }

    function dumpChanges(changes, namespace) {
        for (var p in changes) {
            if (changes.hasOwnProperty(p)) {
                console.debug('cS: changed for namespace: %s, key: %s, value:{oldValue: %s, newValue: %s}', namespace, p, changes[p].oldValue, changes[p].newValue);
            }
        }
    }

    function setValue(name, value) {
        console.debug('cS: setValue(%s,%s) - key: %s', name, value, localState.guid);
        obj[localState.guid + '_' + name] = value;
    }

    function getValue(name) {
        var value = obj[localState.guid + '_' + name];
        console.debug('cS: getValue(%s) - key: %s, returns', name, localState.guid, value);
        return value;
    }

    function getOtherTBID() {
        console.log('cS: getOtherTBID() returns %s', localState.otherTBID);
        return localState.otherTBID;
    }

    function setOtherTBID(tbid) {
        console.debug('cS: setOtherTBID(%s)', tbid);
        if (localState.otherTBID != tbid) {
            localState.otherTBID = tbid;
            if (getValue('state') !== 'foundParent') {
                setValue('state', 'inferredParent');
            }
            setValue('OtherTBID', tbid);
            persistLocalState('otbid');
            persistSyncObj('otbid');
        }
    }

    function getGeneratedTBID() {
        console.log('cS: getGeneratedTBID() returns %s', localState.generatedTBID);
        return localState.generatedTBID;
    }

    function setGeneratedTBID(tbid) {
        console.debug('cS: setGeneratedTBID(%s)', tbid);
        if (localState.generatedTBID != tbid) {
            localState.generatedTBID = tbid;
            if (getValue('state') !== 'foundParent') {
                setValue('state', 'inferredParent');
            }
            setValue('GeneratedTBID', tbid);
            persistLocalState('gtbid');
            persistSyncObj('gtib');
        }
    }

    function getParentTBID() {
        console.log('cS: getParentTBID() returns %s', localState.parentTBID);
        return localState.parentTBID;
    }

    function setParentTBID(tbid, toolbarData) {
        console.debug('cS: setParentTBID(%s, %O)', tbid, toolbarData);
        if (localState.parentTBID != tbid) {
            localState.parentTBID = tbid;
            setValue('state', 'foundParent');
            setValue('dlpTBID', tbid);
            persistLocalState('ptbid');
        }
        if (toolbarData) {
            setValue('dlpToolbarData', JSON.stringify(toolbarData));
        }
        persistSyncObj('ptbid');
    }

    function discoverParent(items, fromOnChange) {
        console.debug('cS: discoverParent(%O)', arguments);
        var props = ['state', 'dlpTBID', 'dlpToolbarData', 'guid', 'GeneratedTBID', 'OtherTBID', 'date'],
            i, len, j, lenj,
            curGuid, curObj, curProp, curKey, curValue,
            MAX_DATE = new Date(8640000000000000).getTime(),
            dlpParent, otherParent = {date: MAX_DATE, tbid: undefined},
            updatedLocalState = false,
            getItemValue = fromOnChange ?
                function(key) {return key in items ? items[key].newValue : undefined;} :
                function(key) {return items[key];};

        for (var p in items) {
            if (items.hasOwnProperty(p) && /guid/.test(p)) {
                curGuid = getItemValue(p);
                if (localState.knownGuids.indexOf(curGuid) === -1) {
                    console.log('cS: discoverParent - found unknown guid: %s', curGuid);
                    localState.knownGuids.push(curGuid);
                    localState.knownToolbars[curGuid] = {};
                    updatedLocalState = true;
                } else {
                    console.debug('cS: discoverParent - found known guid: %s', curGuid);
                }
            }
        }

        console.debug('cS: discoverParent - knownGuids: %O', localState.knownGuids);
        for (i = 0, len = localState.knownGuids.length; i < len; ++i) {
            curGuid = localState.knownGuids[i];
            curObj = localState.knownToolbars[curGuid];
            for (j = 0, lenj = props.length; j < lenj; ++j) {
                curProp = props[j];
                curKey = curGuid + '_' + curProp;
                if (curKey in items) {
                    curObj[curProp] = getItemValue(curKey);
                    updatedLocalState = true;
                }
            }
            console.debug('cS: discoverParent - updated knownToolbars[%s]: %O', curGuid, curObj);
        }

        if (updatedLocalState) {
            persistLocalState('updated in discoverParent');
        }

        console.debug('cS: discoverParent - knownToolbars: %O', localState.knownToolbars);
        // look for dlpParent
        for (i = 0, len = localState.knownGuids.length; i < len; ++i) {
            curGuid = localState.knownGuids[i];
            if ('dlpTBID' in localState.knownToolbars[curGuid]) {
                dlpParent = localState.knownToolbars[curGuid].dlpTBID;
                //console.debug('cS: discoverParent - found parent: %s', dlpParent);
                break;
            }
        }
        if (dlpParent) {
            console.info('cS: discoverParent - found parent: %s', dlpParent);
            setParentTBID(dlpParent);
            Mindspark_Global.setValue('syncParentToolbarId', {id: dlpParent, source: 'dlp'});
        } else {
            console.info('cS: discoverParent - !found parent');
            // look for first otherParent
            for (i = 0, len = localState.knownGuids.length; i < len; ++i) {
                curGuid = localState.knownGuids[i];
                if (localState.knownToolbars[curGuid].date < otherParent.date) {
                    otherParent = localState.knownToolbars[curGuid];
                }
            }
            if (otherParent.GeneratedTBID) {
                console.info('cS: discoverParent - found other parent - generatedTBID: %s', otherParent.GeneratedTBID);
                setOtherTBID(otherParent.GeneratedTBID);
                Mindspark_Global.setValue('syncParentToolbarId', {id: otherParent.GeneratedTBID, source: 'other'});
            } else {
                console.info('cS: discoverParent - !found other parent');
            }
        }
    }

    function persistSyncObj(msg) {
        console.debug('cS: persisting sync obj: %O, %s', obj, msg || '');
        chrome.storage.sync.set(obj, createStub('sync set obj' + (msg ? ' - ' + msg : '')));
    }

    function persistLocalState(msg) {
        console.debug('cS: persisting local localState: %O, %s', localState, msg || '');
        chrome.storage.local.set(
            {localState: JSON.stringify(localState)},
            createStub('local set localState' + (msg ? ' - ' + msg : ''))
        );
    }

    function storageChangedListener(changes, namespace) {
        dumpChanges(changes, namespace);
        switch (namespace) {
            case 'local':
                //nop
                break;
            case 'sync':
                discoverParent(changes, true);
                break;
        }
    }

    function getFromStorageSync(items) {
        if (chrome.runtime.lastError) {
            console.error('cS: getFromStorageSync - chrome.runtime.lastError: %s', chrome.runtime.lastError);
        } else {
            console.debug('cS: getFromStorageSync(%O)', items);
            discoverParent(items, false);
        }
    }

    function getFromStorageLocal(response) {
        if (chrome.runtime.lastError) {
            console.error('cS: getFromStorageLocal - chrome.runtime.lastError: %s', chrome.runtime.lastError);
        } else if (!response.localState) {
            console.debug('cS: getFromStorageLocal(%O) - first time, guid: %s', response, localState.guid);
            setValue('state', 'installing');
            setValue('date', localState.installingTime);
            setValue('guid', localState.guid);
            persistLocalState('initial get');
            persistSyncObj('initial get');
        } else {
            console.debug('cS: getFromStorageLocal(%O) - !first time', response);
            localState = JSON.parse(response.localState);
        }
        Mindspark_Global.setValue('syncParentToolbarId',
            localState.parentTBID ?
            {id: localState.parentTBID, source: 'dlp'} :
            {id: localState.otherTBID || 'undefined', source: 'other'}
        );
        Mindspark_Global.getValue('toolbarId', function(toolbarId) {
            if (/^dlp/i.test(toolbarId.source)) {
                setParentTBID(toolbarId.id);
            } else {
                setGeneratedTBID(toolbarId.id);
            }
        });
    }

    function run() {
        if (chrome.runtime.lastError) {
            console.error('cS: run - chrome.runtime.lastError: %s', chrome.runtime.lastError);
        } else {
            chrome.storage.onChanged.addListener(storageChangedListener);

            chrome.storage.local.get('localState', getFromStorageLocal);

            chrome.storage.sync.get(getFromStorageSync);
        }
    }

    function start() {
        console.log('cS: start()');
        Mindspark_Global.getValue('firstKnownVersion', function (fkv) {
            if(parseInt(fkv || '12') < 12) {
                console.warn('cS: Version:%s < 12, so setting everything to "undefined" (as a string)!', fkv);
            } else {
                console.debug('cS: version is >= 12');
                run();
            }
        });
    }

    function dump() {
        function dumpObj(namespace, obj) {
            if(!obj) {
                console.debug('cS: %s = %s', namespace, obj);
            }
            for (var p in obj) {
                console.debug('cS: %s.%s = %s', namespace, p, p === 'localState' ? JSON.stringify(JSON.parse(obj[p]), null, '  '): obj[p]);
            }
        }
        function getStorageHandler(namespace) {
            return function(obj) {
                dumpObj(namespace, obj);
            };
        }

        if (chrome.storage) {
            console.debug('cS: attempting to dump chrome storage...');
            ['local', 'sync'].forEach(function(name) {
                chrome.storage[name].get(null, getStorageHandler(name));
            });
        } else {
            console.debug('cS: chrome storage not defined');
        }
    }

    var localState = {
            knownGuids: [],
            knownToolbars: {},
            parentTBID: undefined,
            otherTBID: undefined,
            generatedTBID: undefined,
            installingTime: Date.now(),
            guid: createGUID()
        },
        obj = {},
        Sync = {
            //setOtherTBID : setOtherTBID,
            getOtherTBID : getOtherTBID,
            setParentTBID: setParentTBID,
            getParentTBID : getParentTBID,
            setGeneratedTBID : setGeneratedTBID,
            dumpLocalState : dump
        };

    start();

    Mindspark_Global.setValue('Sync', Sync);

})(window,chrome);
