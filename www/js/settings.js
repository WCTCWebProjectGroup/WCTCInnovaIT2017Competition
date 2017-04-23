var settings = new function () {
    var _blackboardCookieName = "blackboardtoken";
    var _googleCookieName = "googletoken";

    // ----- Languages ----- //

    this.SetLanguage = function () {
        var langCont = document.getElementById("languageContainer");
        common.SetLanguage(langCont.value)
            .then(function () {
                common.DisplayLanguages();
            });
    }

    // ----- END Languages ----- //

    function Cookie (name, value, expiration) {
        var _name = name;
        var _value = value;
        var _expiration = Date.parse(expiration);
        this.Name = _name;
        this.Value = _value;
        this.Expiration = _expiration;

        this.toString = function () {
            return "\"" + _name + "\"=" + _value + "; expires=" + Date.parse(_expiration).toUTCString() + "; path=/";
        }
    }

    function _getCookie (cookieName) {
        var fullCookieName = cookieName + "=";
        var decodedCookies = decodeURIComponent(document.cookie);
        decodedCookies
            .split(';')
            .forEach(function(cookiePart) {
                while (cookiePart.charAt(0) == " ") {
                    cookiePart = cookiePart.substring(1);
                }

                if (cookiePart.indexOf(fullCookieName) == 0) {
                    return cookiePart.substring(fullCookieName.length, cookiePart.length);
                }
            });

        return "";
    }

    function _activateTheme () {
        common
            .GetTheme()
            .then(function (themeObj) {
                document
                    .querySelectorAll(".themeable")
                    .forEach(function (themeable) {
                        themeable.setAttribute("class", "themeable " + themeObj);
                });
            });
    }

    this.ActivateTheme = _activateTheme;

    function _blackboardLogin (username, password) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wctc.blackboard.com/webapps/login/");
        xhr.withCredentials = true;
    }

    function _onSignIn(googleUser) {
        var profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    }

    function signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
        console.log('User signed out.');
        });
    }

    // WIP
    this.GetBlackboardTokenCookie = function () {
        console.log(_getCookie(_blackboardCookieName));
    };
}

// ----- Event Listeners ----- //

function settingsInit () {
    var themeTemplateEl = document.getElementById("themeT");
    var listOfThemes = document.getElementById("listOfThemes");

    common.GetAllThemes()
        .then(function (themes) {
            themes.forEach(function (theme) {
                var newThemeEl = document.importNode(themeTemplateEl.content, true);
                var themeLabelEl = newThemeEl.querySelector("label");
                var themeRadioBtnEl = newThemeEl.querySelector("input");

                themeLabelEl.innerText = theme.name;
                themeLabelEl.setAttribute("for", theme.name + "ThemeRadioBtn");
                themeLabelEl.setAttribute("class", "themeLabel");

                themeRadioBtnEl.setAttribute("id", theme.name + "ThemeRadioBtn");
                themeRadioBtnEl.setAttribute("value", theme.active);

                listOfThemes.appendChild(newThemeEl);
                if (theme.active == true) {
                    themeRadioBtnEl.checked = true;
                }

                themeLabelEl.addEventListener("click", function () {
                    if (themeRadioBtnEl.value ) {
                        common.SetThemeToActive(theme.name)
                            .then(function () {
                                settings.ActivateTheme();
                            });
                    }
                });
            });
        });

    document.getElementById("languageContainer").addEventListener("change", function (evt) {
        common.SetActiveLanguage(evt.target.value);
    });

    common.GetAllLanguages()
        .then(function (languages) {
            var langContainer = document.getElementById("languageContainer");
            languages.forEach(function (language) {
                var newLanguageEl = document.createElement("option");
                var cleanName = language.name.charAt(0).toUpperCase() + language.name.slice(1);
                newLanguageEl.innerText = cleanName;

                if (language.active == 1)
                    newLanguageEl.setAttribute("selected", "selected");

                langContainer.appendChild(newLanguageEl);
            });
        })

    common.GetAllTags()
        .then(function (tags) {

        });
};
common.initialize.push(settingsInit);

// ----- END Event Listeners ----- //

// WIP
// Client ID and API key from the Developer Console
var CLIENT_ID = '6602944139-0te741sl8r5po70uev7sk2c81mh9vk78.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        listFiles();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/**
 * Print files.
 */
function listFiles() {
    gapi.client.drive.files.list({
        'pageSize': 10,
        'fields': "nextPageToken, files(id, name)"
    }).then(function(response) {
        appendPre('Files:');
        var files = response.result.files;
        if (files && files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            appendPre(file.name + ' (' + file.id + ')');
        }
        } else {
        appendPre('No files found.');
        }
    });
}