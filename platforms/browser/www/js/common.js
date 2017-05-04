var common = new function () {
    
    // Initializer functions array
    this.initialize = [];
    var init = this.initialize;
    init.push(_DisplayLanguages);
    init.push(function () {
        common.ShowPrimaryLoading();
        _getTheme()
            .then(function (t) {
                _applyThemeCss("", t.name, true);
                common.HidePrimaryLoading();
            });
    });

    // ----- APP NAME ----- //

    this.AppName = "WCTC 2017 InnovaIT Competition";

    // ----- END APP NAME ----- //

    // ----- Constructors ----- //

    function Entry () {
        this.uid = Date.now();
        this.date = new Date();
        this.body = {};
        this.tags = [];
    }

    function Tag () {
        this.name = "";
        this.color = "";
    }

    this.Tag = Tag;

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
            Languages: '++, name, active',
        });
        _db.version(2).stores({
            Entries: 'uid, date, body, tags',
            Themes: '++, &name, active',
            Google: 'username, passwordHash, token',
            Languages: '++, name, active',
            Notifications: '++uid, name, notification'
        });
        
        _setupThemes ();
        _setupLanguages();
    })();

    function _setupThemes () {
        return _db.transaction('rw', _db.Themes, function () {
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
    }

    function _setupLanguages () {
        return _db.transaction('rw', _db.Languages, function () {
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
    }

    function _cordovaNotificationTemplate () {
        this.id = "";
        this.title = "";
        this.text =  "";
        this.every =  "0";
        this.at =  new Date();
        this.badge = 0;
    }

    function _NotificationTemplate () {
        this.id = "";
        this.name = "";
        this.notification = new _cordovaNotificationTemplate();
    }
    this.CordovaNotificationTemplate = _cordovaNotificationTemplate;

    this.GetAllNotifications = function () {
        return _db.Notifications
            .toArray();
    }

    this.RemoveNotification = function (notificationID) {
        return _db.Notifications
            .where('uid')
            .equals(notificationID)
            .delete()
            .then(function () {
                cordova.plugins.notification.local.cancel(notificationID, function() {
                    console.log("deleted notification");
                });
            }).catch(function (err) {
                common.DisplayAlert("Failed to delete notification");
                console.error(err);
            });
    }

    this.AddNotification = function (cordovaNotification) {
        if (cordovaNotification.text == "")
            return;
        if (cordovaNotification.at == null)
            return;

        var n = new _NotificationTemplate();
        n.notification = cordovaNotification;
        n.name = cordovaNotification.text;

        return _db.Notifications
            .add(n)
            .then(function (status, nID) {
                cordovaNotification.id = nID;
                cordova.plugins.notification.local.schedule(cordovaNotification);
            })
            .catch(function (err) {
                console.log(err);
            });
    }

    this.GetLatestNotification = function () {
        return _db.Notifications
            .toArray()
            .then(function (notifications) {
                return notifications[notifications.length - 1];
            });
    }

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
    function _setThemeToActive (themeName) {
        return _db.transaction('rw', _db.Themes, function () {
            _db.Themes
                .where('active')
                .equals(1)
                .first()
                .then(function (ot) {
                    _db.Themes
                        .where('active')
                        .equals(1)
                        .modify({active: 0})
                        .then(function() {
                            _db.Themes
                                .where('name')
                                .equalsIgnoreCase(themeName)
                                .modify({active: 1})
                                .then(function () {
                                    _getTheme()
                                        .then(function (nt) {
                                            _applyThemeCss(ot.name, nt.name, false);
                                        });
                                });
                        });
                })
        });
    }
    this.SetThemeToActive = _setThemeToActive;

    function _applyThemeCss (oldthemename, themename, showLoadingScreen) {
        if (showLoadingScreen)
            common.ShowPrimaryLoading();
            var themables = document.querySelectorAll(".themable")
            for (var el of themables) {
                var elClasses = el.getAttribute("class");
                elClasses = elClasses.replace(oldthemename, "").trim();
                elClasses += " " + themename;
                el.setAttribute("class", elClasses);
            }

            if (showLoadingScreen)
                setTimeout(common.HidePrimaryLoading, 500);
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

                common.AddEntryToDB(entry).then(function () {
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
                    promises.push(common.AddEntryToDB(entry).then(function () {
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
                        var foundSameTagName = false;

                        for (var i = 0; i < uniqueTags.length; i++) {
                            if (uniqueTags[i].name == tag.name && uniqueTags[i].color == tag.color) {
                                foundSameTagName = true;
                                break;
                            }
                        }

                        if (!foundSameTagName)
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

    function _GetActiveLangauge () {
        return _db.Languages
            .where('active')
            .equals(1)
            .toArray();
    }
    this.GetActiveLangauge = _GetActiveLangauge;

    this.SetActiveLanguage = function (langName) {
        return _db.transaction('rw', _db.Languages, function () {
            _db.Languages
                .where('active')
                .equals(1)
                .modify({active: 0})
                .then(function () {
                    _db.Languages
                        .where('name')
                        .equals(langName.toLowerCase())
                        .modify({active: 1});
                })
                .then(function () {
                    _DisplayLanguages();
                });
        }) 
    }

    function _getTheme ()  {
        return _setupThemes()
            .then(function () {
                return _db.Themes
                    .where('active')
                    .equals(1)
                    .first(function (theme) {
                        return theme;
                    });
            });
    }
    this.GetTheme = _getTheme;

    this.SetTheme = function (themename) {
        return _db.Themes
            .where("active")
            .equals(1)
            .modify({active: 0})
            .then(function () {
                _db.Themes
                    .where("name")
                    .equals(themename)
                    .modify({active: 1});
            });
    }

    var _primaryLoadingGif = document.getElementById("loadingGif");
    var _secondaryLoadingGifs = document.getElementsByClassName("secondaryLoadingGif");
    var _primaryLocks = 0;
    var _secondaryLocks = 0;

    // ----- Languages ----- //

    function _DisplayLanguages () {
        var langEls = document.getElementsByClassName("languages");
        _setupLanguages()
            .then(function () {
                _GetActiveLangauge()
                    .then(function (lang) {
                        for (var i = 0; i < langEls.length; i++) {
                            var item = langEls.item(i);
                            var classes = item.getAttribute("class");
                            if (classes.includes(lang[0].name) && classes.includes("inline"))
                                item.style.display = "inline";
                            else if (classes.includes(lang[0].name))
                                item.style.display = "block";
                            else
                                item.style.display = "none";
                        }
                    });
            })
    }

    this.DisplayLanguages = _DisplayLanguages();

    // ----- END Languages ----- //

    this.DownloadJournalEntry = function (entry) {
        return new Promise(function(resolve, reject) {
            try {
                var pdf = new jsPDF('p', 'pt', 'letter');
                var canvas = pdf.canvas;
                canvas.height = 72 * 11;
                canvas.width = 72 * 8.5;

                html2pdf(entry.body.text, pdf, function (pdf) {
                    pdf.save('JournalEntry-' + entry.uid + '.pdf');
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        })
    }

    // ----- Upload to gdrive ----- //

    this.UploadToGoogleDrive = function (entry) {
        // TODO: Check if signed in
        // var contentDocument = entry.body.text;
        // var content = '<!DOCTYPE html>' + contentDocument;
        // var converted = htmlDocx.asBlob(content, {orientation: false});
        var pdf = new jsPDF('p', 'pt', 'letter');
        var canvas = pdf.canvas;
        canvas.height = 72 * 11;
        canvas.width = 72 * 8.5;
        
        return new Promise(function (resolve, reject) {
            html2pdf(entry.body.text, pdf, function (pdf) {
                resolve(pdf);
            });
        }).then(function (resp) {
            // gapi.savetodrive.render("uploadToGDriveHidden", {
            //     src: document.URL,
            //     filename: resp.output("bloburi"),
            //     sitename: "localhost"
            // });
            // document.getElementById("uploadToGDriveHidden").addEventListener("click", )
            // var el = document.getElementsByClassName("save-to-drive-button")[0];
            // el.setAttribute("data-src", document.URL);
            // el.setAttribute("data-filename", resp.output("blob"));
            // el.click();
            return createFile("JournalEntry-" + entry.uid + ".pdf", resp.output("blob"));
        });
        // return test.PerformFileOperation(test.FileOperationsEnum.SAVE, "tmp.docx", url)
        //     .then(function (docx) {
        //         return test.PerformFileOperation(test.FileOperationsEnum.UPLOAD, docx.fileEntry.fullPath);
        //     });
        // return test.PerformFileOperation(test.FileOperationsEnum.SAVE, "test.docx", converted)
        //     .then(function (response) {
        //         return createFile("JournalEntry_" + entry.uid, url);
        //     })
        // return test.PerformFileOperation(test.FileOperationsEnum.UPLOAD, url, null);
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
        common.GetTheme()
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

        document.getElementById("listOfAlerts").appendChild(alertEl);
        alertEl = document.querySelector("#listOfAlerts > li:last-child");

        closeAlertBtnEl.addEventListener("click", function () {
            var listOfAlerts = document.getElementById("listOfAlerts");
            
            listOfAlerts.removeChild(alertEl);

            if (listOfAlerts.childElementCount == 0)
                document.getElementById("openAlert").style.animationName = "none";
                document.getElementById("alertWarningBar").style.animationName = "none";

        });
    }
    
    // Display alert
    this.DisplayAlert = DisplayAlert;
    function DisplayAlert (message) {
        document.getElementById("openAlert").style.animationName = "newAlert";
        document.getElementById("alertWarningBar").style.animationName = "alertWarningBar";

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
        var checkboxID = labeltext.name.replace(" ", "_") + "MCheckbox";

        labelEl.innerText = labeltext.name;
        labelEl.setAttribute("for", checkboxID);;
        labelEl.setAttribute("data-bind", labeltext.color);
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
        {
            name: "first tag",
            color: "#ce1919"
        },
        {
            name: "second tag",
            color: "#83ce1a"
        },
        {
            name: "third tag",
            color: "#425ff4"
        },
    ];

    var rnd = Math.round(Math.random() * tags.length) - 1;

    return tags.slice(0, rnd);
}

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
                var tabName = evt.currentTarget.getAttribute("data-bind");
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

// ----- Test Functions ----- //

var test = {
    fileEntries: [],
    _enumVar: Object.freeze({
        WRITE: 1,
        READ: 2,
        DELETE: 3,
        UPLOAD: 4,
        SAVE: 5
    }),
    get FileOperationsEnum(){
        return this._enumVar;
    },
    // this.fileOperationsEnum = enumVar;

    PerformFileOperation: function (fileOperation, filename, filedata) {
        return new Promise(function (resolve, reject) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                switch (fileOperation) {
                    case test._enumVar.READ:
                    case test._enumVar.WRITE:
                    case test._enumVar.UPLOAD:
                        fs.root.getFile(filename, {create:true,exclusive:false}, function (fileEntry) {
                            if (fileOperation == test.FileOperationsEnum.WRITE) {
                                console.log("selected write operation")
                                fileEntry.createWriter(function (fileWriter) {
                                    fileWriter.onwriteend = function () {
                                        resolve({
                                                fileEntry:fileEntry,
                                                fileSystem:fs
                                            });
                                    };

                                    fileWriter.onerror = function (err) {
                                        console.error(err);
                                        reject(err);
                                    }

                                    fileWriter.write(filedata);
                                });
                            } else if (fileOperation == test.FileOperationsEnum.READ) {
                                console.log("selected read operation");

                                fileEntry.file(function (file) {
                                    var reader = new FileReader();

                                    reader.onloadend = function () {
                                        //console.log("Successfully read file! File data: ");
                                        //console.log(this.result);
                                        if (filedata == null) {
                                            resolve(this.result);
                                        } else {
                                            var blob = new Blob([new Uint8Array(this.result)], { type: "image/png" });
                                            resolve(blob);
                                        }
                                    }

                                    if (filedata == null)
                                        reader.readAsText(file);
                                    else
                                        reader.readAsArrayBuffer(file);
                                    
                                }, reject);
                            } else if (fileOperation == test.FileOperationsEnum.UPLOAD) {
                                if (!window.plugins.gdrive) {
                                    reject("GDrive plugin failed!");
                                } else if (!window.plugins.gdrive.uploadFile == null ) {
                                    reject("GDrive plugin failed!");
                                }
                                window.plugins.gdrive.uploadFile(fileEntry.fullPath,
                                    function (response) {
                                        console.log("successfully uploaded file to gdrive!");
                                        resolve("successfully uploaded file to gdrive!");
                                    },
                                    function (error){
                                        console.log(error);
                                        reject(error);
                                    }
                                );
                            }
                        });
                        break;
                    case test._enumVar.DELETE:
                        console.log("selected delete operation - currently not able to delete?");
                        break;
                    case test._enumVar.SAVE:
                        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {

                            console.log('file system open: ' + fs.name);
                            // saveFile(dirEntry, blob, "downloadedImage.png");
                            fs.root.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                                fileEntry.createWriter(function (fileWriter) {
                                    fileWriter.onwriteend = function() {
                                        console.log("Successful file write...");
                                        // resolve(fileEntry);

                                        // Demo read image
                                        fileEntry.file(function(file) {
                                            var reader = new FileReader();

                                            reader.onloadend = function () {
                                                var blob = new Blob([new Uint8Array(this.result)], { type: "image/png" });
                                                // var elem = document.getElementById('blah2');
                                                // elem.src = window.URL.createObjectURL(blob);
                                                resolve({fileEntry: fileEntry, blob: blob});
                                            };

                                            reader.readAsArrayBuffer(file);
                                        }, reject);
                                    };

                                    fileWriter.onerror = function(e) {
                                        console.log("Failed file write: " + e.toString());
                                        reject(e);
                                    };

                                    fileWriter.write(filedata);
                                });
                            }, reject);
                        }, reject);
                        break;
                    default:
                        console.error("unable to determine operation!");
                        reject("unable to determine operation!");
                }
            });
        });
    }
    // this.PerformFileOperation = _performFileOperation;
};

// ----- GOOGLE DRIVE FUNCTIONS! ----- //

// Client ID and API key from the Developer Console
var CLIENT_ID = '6602944139-0te741sl8r5po70uev7sk2c81mh9vk78.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

var pickerApiLoaded = false;
var picker;

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
gapi.load('client:auth2', initClient);
gapi.load('picker', {'callback': initPicker});
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
 * Initialized Google Picker
 */
function initPicker () {
    if (pickerApiLoaded) {
        var view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("image/png,image/jpeg,image/jpg");
        var picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(appId)
            .setOAuthToken(oauthToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(developerKey)
            .setCallback(pickerCallback)
            .build();
         picker.setVisible(true);
    }
}

function pickerCallback(data) {
    if (data.action == google.picker.Action.PICKED) {
    var fileId = data.docs[0].id;
    alert('The user selected: ' + fileId);
    }
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    //listFiles();
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
// var pre = document.getElementById('content');
// var textContent = document.createTextNode(message + '\n');
// pre.appendChild(textContent);
}

/**
 * Create files
 */
function createFile (name, data) {
    return new Promise(function (resolve, reject) {
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        var reader = new FileReader();

        reader.readAsBinaryString(data);
        reader.onload = function (e) {
            var metadata = {
                "name": name,
                "mimeType": "application/pdf; charset=UTF-8"
            };

            // data = btoa(reader.result);
            data = reader.result;
            var multipartRequestBody =
                delimiter +
                "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
                JSON.stringify(metadata) +
                "\r\n" + delimiter +
                "Content-Type: " + "application/pdf" + "\r\n\r\n" +
                data +
                close_delim;

            var request = gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                }, 'body': multipartRequestBody});
            request.execute(resolve);
        }
    }).catch (function (err) {
        return (err)
    });
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

// ----- END GOOGLE DRIVE FUNCTIONS! ----- //