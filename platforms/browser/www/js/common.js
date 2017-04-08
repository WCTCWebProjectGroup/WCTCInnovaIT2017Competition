/*
 * This object (loading) is responsible for displaying/hiding the various loading screens of the app
 */

var common = new function () {
    var _primaryLoadingGif = document.getElementById("loadingGif");
    var _secondaryLoadingGifs = document.getElementsByClassName("secondaryLoadingGif");
    var _primaryLocks = 0;
    var _secondaryLocks = 0;

    // ----- Applying Theme ----- //

    function _applyTheme () {
        database.GetTheme()
            .then(function (themeObj) {
                var themeableClass = "themeable";
                document.querySelectorAll(".themeable").forEach(function (themeable) {
                    themeable.setAttribute("class", themeableClass + " " + themeObj.name);
                });
            })
    }
    this.ApplyTheme = _applyTheme;

    // ----- END Applying Theme ----- //

    // ----- Primary Loading Screens ----- //
    // Displays the primary loading screen
    this.ShowPrimaryLoading = _ShowPrimaryLoading;
    function _ShowPrimaryLoading () {
        _primaryLocks++;
        _primaryLoadingGif.style.display = "block";
    };

    // Hides the primary loading screen
    this.HidePrimaryLoading = _HidePrimaryLoading;
    function _HidePrimaryLoading () {
        if (_primaryLocks > 0)
            _primaryLocks--;

        if (_primaryLocks == 0)
            _primaryLoadingGif.style.display = "none";
    };
    // ----- END Primary Loading Screens ----- //


    // ----- Secondary Loading Screens ----- //
    // Displays all secondary loading screens
    this.ShowSecondaryLoading = _ShowSecondaryLoading;
    function _ShowSecondaryLoading () {
        if (_secondaryLocks > 0)
            _secondaryLocks++;

        for (var i = 0; i < _secondaryLoadingGifs.length; i++) {
            _secondaryLoadingGifs.item(i).style.visibility = "hidden";
        }
    };

    // Hides all secondary loading screens
    this.HideSecondaryLoading = _HideSecondaryLoading;
    function _HideSecondaryLoading () {
        if (_secondaryLocks > 0)
            _secondaryLocks--;
        
        if (_secondaryLocks == 0) {
            for (var i = 0; i < _secondaryLoadingGifs.length; i++) {
                _secondaryLoadingGifs.item(i).style.display = "none";
            }
        }
    };
    // ----- END Secondary Loading Screens ----- //


    // ----- All Loading Screens ----- //
    // Displays ALL loading screens
    this.ShowAllLoadingScreens = function () {
        _ShowPrimaryLoading();
        _ShowSecondaryLoading();
    };

    // Hides ALL loading screens
    this.HideAllLoadingScreens = function () {
        _HidePrimaryLoading();
        _HideSecondaryLoading();
    };
    // ----- END All Loading Screens ----- //

    // ----- Alerts ----- //
    var _alertActive = false;
    var _alertQueue = [];
    
    // Display alert
    this.DisplayAlert = DisplayAlert;
    function DisplayAlert (message) {
        document.getElementById("openAlert").style.animationName = "newAlert";
        if (_alertActive) {
            _alertQueue.push(message);
        } else {
            _alertActive = true;
            var messageEl = document.getElementById("alertBg");
            document.getElementById("alertMessage").innerHTML = message;
            messageEl.style.visibility = "visible";
        }
    };

    // Close alert
    this.CloseAlert = CloseAlert;
    function CloseAlert () {
        if (!_alertActive) {
            console.log("Warning: Attempt to close alert when no alert was open!");
        } else if (_alertQueue.length > 0) {
            while (_alertQueue.length > 0) {
                DisplayAlert(_alertQueue.shift());
            }
        } else {
            document.getElementById("alertBg").style.visibility = "hidden";
            _alertActive = false;
        }
    };

    // ----- END Alerts ----- //

    // ----- Create Common Elements ----- //
    
    function _CreateMCheckBox (labeltext) {
        let checkboxContainerEl = document.createElement("div");
        let checkboxtagEl = document.createElement("input");

        checkboxtagEl.setAttribute("type", "checkbox");
        checkboxtagEl.setAttribute("data-tagname", labeltext);

        checkboxContainerEl.setAttribute("class", "MCheckbox");

        checkboxContainerEl.appendChild(checkboxtagEl);

        return checkboxContainerEl;
    }
    this.CreateMCheckbox = _CreateMCheckBox;

    // ----- END Create Common Elements ----- //

    

    // Add event listener on the close alert element
    (function () {
        document
            .getElementById("closeAlert")
            .addEventListener("click", () => {
                CloseAlert();
            });
    })();

    // ----- END Alerts ----- //
};

// ----- Attach Common Event Listeners ----- //
(function () {
    var _boxShadow = document.getElementById("sideNav").style.boxShadow;
    document.getElementById("sideNav").style.boxShadow = "none";

    function _openAlerts () {

    }

    function _openNav () {
        document.querySelector("#sideNav .alerts").style.display = "none";
        document.getElementById("drawerContent").style.display = "block";
        document.getElementById("sideNav").style.left = "0";
        document.getElementById("sideNav").style.boxShadow = _boxShadow;
    }

    function _closeDrawer () {
        document.getElementById("sideNav").style.left = "-100%";
        document.getElementById("sideNav").style.boxShadow = "none";
    }

    document.getElementById("openDrawer").addEventListener("click", _openNav);
    document.getElementById("openAlert").addEventListener("click", _openAlerts)
    document.getElementById("clsBtn").addEventListener("click", _closeDrawer);
    document.getElementById("sideNavNotClickable").addEventListener("click", _closeDrawer);
    document.querySelectorAll("#shareEntry").forEach(function (element) {
        element.addEventListener("click", () => {
            common.DisplayAlert("Sharing is still a WIP!");
        });
    });

    // Handle tabs
    if (document.querySelectorAll(".MTabViews").length > 0) {
        var tabEls = document.getElementsByClassName("MTabLabel");
        for (let tablabel of tabEls) {
            tablabel.addEventListener("click", function (evt) {
                var tabName = tablabel.innerText;
                var tabcontent = document.getElementsByClassName("MTab");
                for (var i = 0; i < tabcontent.length; i++) {
                    tabcontent[i].style.display = "none";
                }

                // Get all elements with class="tablinks" and remove the class "active"
                var tablinks = document.getElementsByClassName("MTabLabel");
                for (i = 0; i < tablinks.length; i++) {
                    tablinks[i].className = tablinks[i].className.replace(" active", "");
                }

                // Show the current tab, and add an "active" class to the button that opened the tab
                var tabs = document.getElementsByClassName("MTab");
                for(let tab of tabs) {
                    if (tab.getAttribute("data-bind") == tabName) {
                        tab.style.display = "block";
                    }
                };
                evt.currentTarget.className += " active";
            });
        }

        // Then select the first tab as active
        document.querySelector(".MTabLabel").click();
    }
})();