// Database functions and vars
// The app will use only ONE database, for now it will be called TripMySchoolJournalDB
// Needs to be included before index.js!

// *The database currently has the tables; 'Entries'

var initialize = [];

var database = new function () {

    // ----- Constructors ----- //

    function Entry () {
        this.uid = Date.now();
        this.date = new Date();
        this.body = {};
        this.tags = [];
    }

    function Theme (name) {
        this.name = name;
        this.active = false;
    }

    var _lightTheme = new Theme('light');
    _lightTheme.active = true;

    var _darkTheme = new Theme('dark');

    // ----- End Constructors ----- //

    var _db = {};

    function _DB_name () {
        return "TripMySchoolJournalDB";
    }

    // Setup database
    (function () {
        _db = new Dexie(_DB_name());

        _db.version(1).stores({
            Entries: 'uid, date, body, tags',
            Themes: '++, &name, active',
            Google: 'username, passwordHash, token',
            Languages: '++, name, active'
        });
        _db.transaction('rw', _db.Themes, function () {
            _db.Themes
                .toCollection()
                .toArray()
                .then(function (themes) {
                    if (themes.length < 1) {
                        _db.Themes.
                            bulkAdd([
                                {name: 'light', active: 1 },
                                {name: 'dark', active: 0 },
                            ]);
                        
                    }
                })
        }).catch(function (error) {
            console.log("failed to add themes to the db!");
        });
        
        _db.transaction('rw', _db.Languages, function () {
            _db.Languages
                .toCollection()
                .toArray()
                .then(function (languages) {
                    if (languages.length < 1) {
                        _db.Languages
                            .bulkAdd([
                                {name: 'english', active: 1},
                                {name: 'german', active: 0},
                                {name: 'gaelic', active: 0}
                            ]);
                    }
                })
        }).catch(function (error) {
            console.log("failed to add languages to the db!")
        });
    })();

    this.AddThemes = function () {
        _db.transaction('rw', _db.Themes, function () {
            _db.Themes
                .toCollection()
                .toArray()
                .then(function (themes) {
                    if (themes.length < 1) {
                        // Create dark & light themes if no themes present
                        var themes = [_lightTheme, _darkTheme]
                        _db.Themes.
                            put(_lightTheme);
                    }
                })
        }).catch(function (error) {
            console.log("failed to add themes to the db!");
        });
    }

    // Get all themes
    this.GetAllThemes = function () {
        return _db.Themes
            .toCollection()
            .toArray();
    }

    // Set theme to active
    this.SetThemeToActive = function (themeName) {
        return _db.transaction('rw', _db.Themes, function () {
            _db.Themes
                .where('active')
                .equals(1)
                .modify(function (theme) {
                    theme.active = 0;
                });
            _db.Themes
                .where('name')
                .equalsIgnoreCase(themeName)
                .modify(function (theme) {
                    theme.active = 1;
                });
        })
    }

    // Generates random uid
    function _GenerateRandomUID () {
        return _db.Entries
            .toArray()
            .then(function (arrayOfEntries) {
                return arrayOfEntries.length > 0 ? arrayOfEntries[arrayOfEntries.length - 1].uid + 1 : 1;
            });
    }

    // Adds an entry to the db
    this.AddEntryToDB = function (entry) {
        if (entry.date == null)
            throw "Error: entry.date was invalid!";
        if (entry.body == null)
            throw "Error: entry.body was invalid!";
        if (entry.tags == null)
            throw "Error: entry.tags was invalid!";
        if (entry.uid == null)
            throw "Error: entry.uid was invalid!";

        return _db.transaction('rw', _db.Entries, function () {
                _db.Entries.add({
                    uid: entry.uid,
                    date: entry.date,
                    body: entry.body,
                    tags: entry.tags
                }).then(function () {
                    console.log("Added user to the db");
                }).catch(function (error) {
                    throw "Error occured while adding an entry to the db!";
                });
        });
    }

    // Create new entry
    this.CreateNewEntry = _CreateNewEntry;
    function _CreateNewEntry (datetime, body, tags) {
        return _GenerateRandomUID()
            .then(function (newUid) {
                var entry = new Entry();
                entry.date = datetime;
                entry.body.text = body;
                entry.tags = tags;
                entry.uid = newUid;

                database.AddEntryToDB(entry).then(function () {
                    console.log("Added entry");
                });
            })
    }

    // Gets all entries from the db
    this.GetAllEntriesFromDB = function () {
        return _db.Entries.toArray();
    };

    // Gets x entries from the db
    this.GetEntriesFromDB = function (limit) {
        return _db
            .Entries
            .orderBy("date")
            .reverse()
            .limit(limit)
            .toArray();
    };

    // Gets one entry from the db based on the uid
    this.GetEntryInDB = function (uid) {
        return _db.Entries
            .where('uid')
            .equals(uid)
            .first();
    };

    // Gets all entries that occur on the specified day
    this.GetEntriesOnDay = function (date) {
        var start = new Date(date);
        start.setHours(0,0,0,0);

        var end = new Date(date);
        end.setHours(23,59,59,999)

        return _db.Entries
            .where('date')
            .between(start, end)
            .toArray();
    }

    // Updates an entry from the db based on the uid
    this.UpdateEntryInDB = function (entry) {
        return _db.Entries
            .where('uid')
            .equals(entry.uid)
            .modify({
                date: entry.date,
                body: entry.body,
                tags: entry.tags
            });
    };

    // Removes all entries from the db
    this.RemoveAllEntriesInDB = function () {
        return _db.Entries
            .clear()
            .then(function () {
                console.log("Finished clearing the db");
            });
    }

    // Removes one entry from the db based on the uid
    this.RemoveEntryFromDB = function (uid) {
        return _db.Entries
            .delete(uid)
            .then(function () {
                console.log("Deleted entry");
            });
    }

    // Enters dummy entries into the database
    this.CreateRandEntries = function (numToCreate) {
        var promises = [];
        var newEntries = [];
    
        return _GenerateRandomUID()
            .then(function (newUid) {
                for (var i = 0; i < numToCreate; i++) {
                    var entry = new Entry();
                    entry.body.text = "<p>" + RandFirstName() + " " + RandLastName() + " " + RandBody() + "</p>";
                    entry.tags = RandTag();
                    entry.uid = i + newUid;

                    newEntries.push(entry);
                    promises.push(database.AddEntryToDB(entry).then(function () {
                        console.log("Added entry");
                    }));
                }
            }).then(function () {
                return Promise.all(promises).then(function () {
                    console.log("Finished adding entries to the db");
                });
            }).then(function () {
                return newEntries;
            });
    }

    this.GetAllTags = function () {
        return _db.Entries
            .toCollection()
            .toArray()
            .then(function (array) {
                var uniqueTags = [];
                array.forEach(function (entry) {
                    entry.tags.forEach(function (tag) {
                        if (!uniqueTags.includes(tag))
                            uniqueTags.push(tag);
                    });
                });

                return uniqueTags;
            });
    }

    this.GetAllLanguages = function () {
        return _db.Languages
            .toCollection()
            .toArray()
            .then(function (array) {
                return array;
            });
    }

    this.GetActiveLangauge = function () {
        return _db.Languages
            .where('active')
            .equals(1)
            .toArray();
    }

    this.SetActiveLanguage = function (langName) {
        return _db.transaction('rw', _db.Languages, function () {
            _db.Languages
                .where('active')
                .equals('1')
                .modify({active: 0})
                .then(function () {
                    _db.Languages
                        .where('name')
                        .equals(langName)
                        .modify({active: 1});
                });
        }) 
    }

    this.GetTheme = function ()  {
        return _db.Themes
            .where('active')
            .equals(1)
            .first(function (theme) {
                return theme;
            });
    }

    this.SetTheme = function (themeObj) {
        return _db.Themes
            .update(themeObj.name, {
                name: theme.name,
                primary: theme.primary,
                secondary: theme.secondary,
                ternary: theme.ternary,
                quaternary: theme.quaternary,
                active: theme.active
            });
    }
}

// Dummy data generator

function RandFirstName () {
    var names = [
        "Alex",
        "Bob",
        "Charlie",
        "Doug",
        "Erik",
        "George",
        "Hal",
        "Isaac",
        "Jack"
    ]

    var rnd = Math.round(Math.random() * names.length) - 1;

    return names[rnd];
}

function RandLastName () {
    var names = [
        'Baker',
        'Charming',
        'Dolye',
        'Evers',
        'Fourier',
        'Giant'
    ];

    var rnd = Math.round(Math.random() * names.length) - 1;

    return names[rnd];
}

function RandBody () {
    var bodies = [
        "first body",
        "second body",
        "third body",
        "fourth body",
        "fifth body"
    ];

    var rnd = Math.round(Math.random() * bodies.length) - 1;

    return bodies[rnd];
}

function RandTag () {
    var tags = [
        "first tag",
        "second tag",
        "third tag"
    ];

    var rnd = Math.round(Math.random() * tags.length) - 1;

    return tags.slice(0, rnd);
}



/*
 * This object (loading) is responsible for displaying/hiding the various loading screens of the app
 */

var common = new function () {
    var _primaryLoadingGif = document.getElementById("loadingGif");
    var _secondaryLoadingGifs = document.getElementsByClassName("secondaryLoadingGif");
    var _primaryLocks = 0;
    var _secondaryLocks = 0;

    // ----- Languages ----- //

    this.DisplayLanguages = function () {
        var langEls = document.getElementsByClassName("languages");
        database.GetActiveLangauge()
            .then(function (lang) {
                langEls.forEach(function (langEl) {
                    var classes = langEl.getAttribute("class");
                    if (classes.includes(lang.name))
                        langEl.style.display = "block";
                    else
                        langEl.style.display = "none";
                });
            });
    }

    // ----- END Languages ----- //

    // ----- Upload to gdrive ----- //

    this.UploadToGoogleDrive = function (entry) {
        // TODO: Check if signed in
        
        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {

            console.log('file system open: ' + fs.name);
            fs.root.getFile("tmp.txt", {create: true, exclusive: false}, function(fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function() {
                        console.log("Successful file write...");
                        window.plugins.gdrive.uploadFile(fileEntry.fullPath, function (res) {
                            console.log("Successfully uploaded file " + fileEntry.fullPath + " to gdrive!");
                            return "Successfully uploaded file " + fileEntry.fullPath + " to gdrive!";
                        }, function (err) {
                            console.log(err);
                            return err;
                        });
                    };

                    fileWriter.onerror = function (e) {
                        console.log("Failed file write: " + e.toString());
                        return "Failed file write: " + e.toString();
                    };

                    dataObj = new Blob([entry.body.text], { type: 'text/plain' });

                    fileWriter.write(dataObj);
                });
            });

        }, console.log);
    }

    // ----- END Upload to gdrive ----- //

    // ----- Blackboard Crap ----- //

    function _makeRequest (method, url) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            return new Promise(function (resolve, reject) {resolve(xhr)});
        };
        
        xhr.onerror = function () {
            return new Promise(function (resolve, reject) {reject(xhr)});
        };

        xhr.send();
    }

    this.LoginToBlackboard = function (username, password) {
        var iw = document.getElementById("blackboardLoginContainer").contentWindow;
        
        _makeRequest('GET', 'localhost:8000/index.html')
        .then(function (response) {
            console.log(response);
        });
    }

    // ----- END Blackboard Crap ----- //

    // ----- Applying Theme ----- //

    function _applyTheme () {
        database.GetTheme()
            .then(function (themeObj) {
                var themeableClass = "themeable";
                var themeables = document.querySelectorAll("." + themeableClass);
                for (var i = 0; i < themeables.length; i++) {
                    themeables[i].setAttribute("class", themeableClass + " " + themeObj.name);
                }
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

    function _createAlertEl (alertText) {
        var alertEl = document.importNode(document.getElementById("alertT").content, true);
        var alertBodyEl = alertEl.querySelector("span");
        var closeAlertBtnEl = alertEl.querySelector("input");

        alertBodyEl.innerText = alertText;

        document.getElementById("listOfAlerts").insertBefore(alertEl, document.querySelector("#listOfAlerts > li:first-child"));
        alertEl = document.querySelector("#listOfAlerts > li:first-child");

        closeAlertBtnEl.addEventListener("click", function () {
            var listOfAlerts = document.getElementById("listOfAlerts");
            
            listOfAlerts.removeChild(alertEl);

            if (listOfAlerts.childElementCount == 0)
                document.getElementById("openAlert").style.animationName = "none";

        });
    }
    
    // Display alert
    this.DisplayAlert = DisplayAlert;
    function DisplayAlert (message) {
        document.getElementById("openAlert").style.animationName = "newAlert";

        // Create alert element and append it to the list of alerts
        _createAlertEl(message);

        // if (_alertActive) {
        //     _alertQueue.push(message);
        // } else {
        //     _alertActive = true;
        //     var messageEl = document.getElementById("alertBg");
        //     document.getElementById("alertMessage").innerHTML = message;
        //     messageEl.style.visibility = "visible";
        // }
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
        var containerEl = document.createElement("div");
        var labelEl = document.createElement("label");
        var checkboxEl = document.createElement("input");
        var checkboxID = labeltext.replace(" ", "_") + "MCheckbox";

        labelEl.innerText = labeltext;
        labelEl.setAttribute("for", checkboxID);
        labelEl.setAttribute("class", "themeLabel");
        
        checkboxEl.setAttribute("id", checkboxID);
        checkboxEl.setAttribute("class", "MCheckbox");
        checkboxEl.setAttribute("type", "checkbox");

        containerEl.appendChild(checkboxEl);
        containerEl.appendChild(labelEl);

        return containerEl;
    }
    this.CreateMCheckbox = _CreateMCheckBox;

    // ----- END Create Common Elements ----- //

    

    // Add event listener on the close alert element
    (function () {
        document
            .getElementById("closeAlert")
            .addEventListener("click", function () {
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
        document.querySelector("#sideNav .alerts").style.display = "block";
        document.getElementById("drawerContent").style.display = "none";
        document.getElementById("sideNav").style.left = "0";
        document.getElementById("sideNav").style.boxShadow = _boxShadow;
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
    var shareEntries = document.querySelectorAll("#shareEntry");
    for (var i = 0; i < shareEntries.length; i++) {
        shareEntries[i].addEventListener("click", function () {
            common.DisplayAlert("Sharing is still a WIP!");
        });
    }

    // Handle tabs
    if (document.querySelectorAll(".MTabViews").length > 0) {
        var tabEls = document.getElementsByClassName("MTabLabel");
        for (var i = 0; i < tabEls.length; i++) {
            tabEls[i].addEventListener("click", function (evt) {
                var tabName = evt.currentTarget.innerText;
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
                for(var i = 0; i < tabs.length; i++) {
                    if (tabs[i].getAttribute("data-bind") == tabName) {
                        tabs[i].style.display = "block";
                    }
                };
                evt.currentTarget.className += " active";
            });
        }

        // Then select the first tab as active
        document.querySelector(".MTabLabel").click();
    }
})();

initialize.push(common.DisplayLanguages);