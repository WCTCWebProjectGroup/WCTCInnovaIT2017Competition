var settings = new function () {
    var _blackboardCookieName = "blackboardtoken";
    var _googleCookieName = "googletoken";

    function Cookie (name, value, expiration) {
        let _name = name;
        let _value = value;
        let _expiration = Date.parse(expiration);
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
        database
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

(function () {
    var themeTemplateEl = document.getElementById("themeT");
    var listOfThemes = document.getElementById("listOfThemes");

    database.GetAllThemes()
        .then(function (themes) {
            themes.forEach(function (theme) {
                let newThemeEl = document.importNode(themeTemplateEl, true);
                let themeLabelEl = newThemeEl.getElementByTagName("label");
                let themeCheckBoxEl = newThemeEl.getElementByTagName("input");

                themeLabelEl.innerText = theme.name;
                themeLabelEl.setAttribute("for", theme.name + "ThemeCheckbox");

                themeCheckBoxEl.setAttribute("id", theme.name + "ThemeCheckbox");
                themeCheckBoxEl.setAttribute("value", theme.active);

                listOfThemes.appendChild(newThemeEl);

                newThemeEl.addEventListener("click", function (theme) {
                    if (newThemeEl.value) {
                        database.SetThemeToActive(theme.name)
                            .then(()=>{
                                settings.ApplyTheme();
                            });
                    }
                });
            });
        });
})();

// ----- END Event Listeners ----- //

// WIP
function handleClientLoad () {
	console.log("WIP Handling client load...");
}