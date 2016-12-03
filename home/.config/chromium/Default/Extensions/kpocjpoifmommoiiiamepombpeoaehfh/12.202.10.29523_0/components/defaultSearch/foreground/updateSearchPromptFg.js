/**
 * Created with IntelliJ IDEA.
 * User: steven.harris
 * Date: 2/14/13
 * Time: 2:32 PM
 * To change this template use File | Settings | File Templates.
 */


(function(){
    console.log('location.protocol: %s', location.protocol);
    if (location.protocol === 'file:'){
        var showNextDialog = function (){
                var ids = ['promptOverrideSearch', 'promptRestart', 'promptRestartAfterInstall', 'promptRestarting', 'promptUnableToRestart'],
                    sliceClassNames = function(elementName, classNameToRemove, classNameToAdd){
                        var element = document.getElementById(elementName),
                            classNames = element.className.split(' '),
                            indexClassNameToRemove = classNames.indexOf(classNameToRemove),
                            indexClassNameToAdd = classNames.indexOf(classNameToAdd);
                        if (indexClassNameToRemove !== -1){
                            classNames.splice(indexClassNameToRemove, 1);
                        }
                        if (classNameToAdd && indexClassNameToAdd === -1){
                            classNames.push(classNameToAdd);
                        }
                        element.className = classNames.join(' ');
                        return indexClassNameToRemove !== -1;
                    },
                    foundIndex = -1;

                ids.forEach(function(id, index){
                    if (sliceClassNames(id, 'showBlock', 'hideBlock')){
                        foundIndex = index;
                    }
                });

                foundIndex += 1;
                foundIndex %= ids.length;
                sliceClassNames(ids[foundIndex], 'hideBlock', 'showBlock');
            },
            createButton = function(){
                var button = document.createElement('button');

                button.onclick = showNextDialog;
                button.innerHTML = 'Show Next';
                button.style.position = 'absolute';
                button.style.marginLeft = '-50px';
                button.style.left = '50%';
                button.style.top = '90%';
                button.style.width = '100px';

                document.body.appendChild(button);
            },
            injectDummyText = function(){
                document.getElementById('appName').innerText = 'Awesome Toolbar';
            },
            checkAppImg = function(){
                var img = document.getElementById('appIcon');
                if (!img.naturalWidth){
                    //img.src = "icon48.png";
                }
            };

        createButton();
        injectDummyText();
        checkAppImg();
    }
})();

(function () {
    console.log('USP-FG: anon()');
    var ID_OVERRIDE_PROMPT = 'promptOverrideSearch',
        ID_DO_NOT_OVERRIDE_SEARCH = 'doNotOverrideSearch',
        ID_OVERRIDE_SEARCH = 'overrideSearch',
        ID_PROMPT_RESTART = 'promptRestart',
        ID_DO_NOT_RESTART = 'doNotRestart',
        ID_RESTART = 'restart',
        ID_PROMPT_RESTART_AFTER_INSTALL = 'promptRestartAfterInstall',
        ID_DO_NOT_RESTART_AFTER_INSTALL = 'doNotRestartAfterInstall',
        ID_RESTART_AFTER_INSTALL = 'restartAfterInstall',
        ID_PROMPT_RESTARTING = 'promptRestarting',
        ID_PROMPT_UNABLE_TO_RESTART = 'promptUnableToRestart',
        ID_CLOSE_AFTER_UNABLE_TO_RESTART = 'closeAfterUnableToRestart',
        ID_APP_ICON = 'appIcon',
        ID_APP_NAME = 'appName',
        ID_BROWSER_HOME_URL_DESC = 'browserHomeUrlDesc',
        ID_WHY = 'why',
        FOREGROUND = updateSearchPromptBg.FOREGROUND,
        BACKGROUND = updateSearchPromptBg.BACKGROUND,
        domPrompt = document.getElementById(ID_OVERRIDE_PROMPT),
        domRestart = document.getElementById(ID_PROMPT_RESTART),
        domRestartAfterInstall = document.getElementById(ID_PROMPT_RESTART_AFTER_INSTALL),
        domRestarting = document.getElementById(ID_PROMPT_RESTARTING),
        domUnableToRestart = document.getElementById(ID_PROMPT_UNABLE_TO_RESTART),
        domWhy = document.getElementById(ID_WHY),
        attachHandlers = function(handlers){
            console.log('USP-FG: attachHandlers(%s)', handlers);
            document.getElementById(ID_DO_NOT_OVERRIDE_SEARCH).addEventListener('click', handlers.doNotOverride);
            document.getElementById(ID_OVERRIDE_SEARCH).addEventListener('click', handlers.override);
            document.getElementById(ID_DO_NOT_RESTART).addEventListener('click', handlers.doNotRestart);
            document.getElementById(ID_RESTART).addEventListener('click', handlers.restart);
            document.getElementById(ID_DO_NOT_RESTART_AFTER_INSTALL).addEventListener('click', handlers.doNotRestart);
            document.getElementById(ID_RESTART_AFTER_INSTALL).addEventListener('click', handlers.restart);
            document.getElementById(ID_CLOSE_AFTER_UNABLE_TO_RESTART).addEventListener('click', handlers.closeDialog);
            console.log('USP-FG: attachHandlers - leaving');
        },
        injectElements = function(request){
            console.log('USP-FG: injectElements(%s)', request);
            if (request.appIcon){
                console.log('USP-FG: injectElements - appIcon: %s, appName: %s, browserHomeUrlDesc: %s', request.appIcon, request.appName, request.browserHomeUrlDesc);
                document.getElementById(ID_APP_ICON).setAttribute('src', request.appIcon);
                document.getElementById(ID_APP_NAME).innerHTML = request.appName;
                document.getElementById(ID_BROWSER_HOME_URL_DESC).innerHTML = request.browserHomeUrlDesc;
            }
            console.log('USP-FG: injectElements - leaving');
        },
        showModalWindow = function(){
            console.log('USP-FG: showModalWindow()');
            toggleClassNames(document.body, 'showBlock', 'hideBlock');
            console.log('USP-FG: showModalWindow - leaving');
        },
        showPrompt = function(){
            console.log('USP-FG: showPrompt()');
            hideAll();
            showModalWindow();
            toggleClassNames(domPrompt, 'showBlock', 'hideBlock');
            console.log('USP-FG: showPrompt - leaving');
        },
        showRestart = function(){
            console.log('USP-FG: showRestart()');
            hideAll();
            showModalWindow();
            toggleClassNames(domRestart, 'showBlock', 'hideBlock');
            console.log('USP-FG: showRestart - leaving');
        },
        showRestartAfterInstall = function(){
            console.log('USP-FG: showRestartAfterInstall()');
            hideAll();
            showModalWindow();
            toggleClassNames(domRestartAfterInstall, 'showBlock', 'hideBlock');
            console.log('USP-FG: showRestart - leaving');
        },
        showRestarting = function(){
            console.log('USP-FG: showRestarting()');
            hideAll();
            showModalWindow();
            toggleClassNames(domRestarting, 'showBlock', 'hideBlock');
            console.log('USP-FG: showRestarting - leaving');
        },
        showUnableToRestart = function(){
            console.log('USP-FG: showUnableToRestart()');
            hideAll();
            showModalWindow();
            toggleClassNames(domUnableToRestart, 'showBlock', 'hideBlock');
            console.log('USP-FG: showUnableToRestart - leaving');
        },
        hideAll = function(){
            toggleClassNames(document.body, 'hideBlock', 'showBlock');
            toggleClassNames(domPrompt, 'hideBlock', 'showBlock');
            toggleClassNames(domRestart, 'hideBlock', 'showBlock');
            toggleClassNames(domRestartAfterInstall, 'hideBlock', 'showBlock');
            toggleClassNames(domRestarting, 'hideBlock', 'showBlock');
            toggleClassNames(domUnableToRestart, 'hideBlock', 'showBlock');
            toggleClassNames(domWhy, 'hideStuff', 'showStuff');
        },
        removeAll = function(){
            console.log('USP-FG: removeAll()');
            toggleClassNames(document.body, 'hideBlock', 'showBlock');
            console.log('USP-FG: removeAll - leaving');
        },
        toggleClassNames = function(element, addName, removeName){
            //nsole.log('USP-FG: toggleClassNames(%s, %s, %s)', element, addName, removeName);
            var className = element.className,
                classNames = className.split(/\s+/),
                indexToRemove = classNames.indexOf(removeName);

            if (indexToRemove !== -1){
                classNames.splice(indexToRemove, 1);
            }

            if (classNames.indexOf(addName) === -1){
                classNames.push(addName);
            }

            element.className = classNames.join(' ');
            //nsole.log('USP-FG: toggleClassNames - was: "%s", now: "%s"', className, element.className);
        },
        promptHandlers = {
            doNotOverride: function(){
                console.log('USP-FG: doNotOverride()');
                Messaging.send({
                        "name": FOREGROUND.MSG_NAME,
                        "cmd": FOREGROUND.NO_CMD
                    }, msgCallback);
            },
            override: function(){
                console.log('USP-FG: override()');
                Messaging.send({
                        "name": FOREGROUND.MSG_NAME,
                        "cmd": FOREGROUND.YES_CMD
                    }, msgCallback);
            },
            doNotRestart: function(){
                console.log('USP-FG: doNotRestart()');
                Messaging.send({
                    "name": FOREGROUND.MSG_NAME,
                    "cmd": FOREGROUND.NOT_NOW_CMD
                }, msgCallback);
            },
            restart: function(){
                console.log('USP-FG: restart()');
                Messaging.send({
                    "name": FOREGROUND.MSG_NAME,
                    "cmd": FOREGROUND.RESTART_CMD
                }, msgCallback);
            },
            closeDialog: function(){
                console.log('USP-FG: closeDialog()');
                Messaging.send({
                    "name": FOREGROUND.MSG_NAME,
                    "cmd": FOREGROUND.CLOSE_DIALOG_CMD
                }, msgCallback);
            }
        },
        bgListener = function(request /*, sender, sendResponse*/){
            console.log('USP-FG: bgListener(%s)', request);
            switch (request.cmd){
            case BACKGROUND.SHOW_PROMPT_CMD:
                attachHandlers(promptHandlers);
                injectElements(request);
                showPrompt();
                break;
            case BACKGROUND.SHOW_RESTART_CMD:
                attachHandlers(promptHandlers);
                showRestart();
                break;
            case BACKGROUND.SHOW_RESTART_AFTER_INSTALL_CMD:
                attachHandlers(promptHandlers);
                injectElements(request);
                showRestartAfterInstall();
                break;
            case BACKGROUND.SHOW_RESTARTING_CMD:
                attachHandlers(promptHandlers);
                injectElements(request);
                showRestarting();
                break;
            case BACKGROUND.SHOW_UNABLE_TO_RESTART_CMD:
                attachHandlers(promptHandlers);
                injectElements(request);
                showUnableToRestart();
                break;
            case BACKGROUND.REMOVE_CMD:
                removeAll();
                break;
            }
            console.log('USP-FG: bgListener - leaving');
        },
        sendReady = function(){
            console.log('USP-FG: sendReady()');
            Messaging.send({
                    "name": FOREGROUND.MSG_NAME,
                    "cmd": FOREGROUND.READY_CMD
                }, bgListener);
            console.log('USP-FG: sendReady - leaving');
        },
        msgCallback = function(){
            console.log('USP-FG: msgCallback()');
        },
        addListener = function(){
            console.log('USP-FG: addListener()');
            Messaging.addListener({"name" : BACKGROUND.MSG_NAME}, bgListener);
            console.log('USP-FG: addListener - leaving');
        };

    addListener();
    sendReady();
    console.log('USP-FG: anon - leaving');
})();