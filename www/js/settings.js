var settings = new function () {
    var _blackboardCookieName = "blackboardtoken";
    var _googleCookieName = "googletoken";

    function _applyTheme () {
        database
            .GetTheme()
            .then(function (themeObj) {
                document
                    .querySelectorAll(".themeable")
                    .foreach(function (themeable) {
                        themeable.setAttribute("class", "themeable " + themeObj);
                });
            });
    }

    this.ApplyTheme = _applyTheme;

    function _blackboardLogin (username, password) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wctc.blackboard.com/webapps/login/");
        xhr.withCredentials = true;
    }
}