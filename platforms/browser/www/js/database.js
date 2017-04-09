// Database functions and vars
// The app will use only ONE database, for now it will be called TripMySchoolJournalDB
// Needs to be included before index.js!

// *The database currently has the tables; 'Entries'

initialize.push(TestFunctions);

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
            Google: 'username, passwordHash, token'
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
                let entry = new Entry();
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
        let promises = [];
        let newEntries = [];
    
        return _GenerateRandomUID()
            .then(function (newUid) {
                for (var i = 0; i < numToCreate; i++) {
                    let entry = new Entry();
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

// ----- Connectors ----- //

var connector = (new function(){
    var _increment = 10;
    var _position = 0;
    var _min = -1;
    var _max = -1;
    var _allEntries = [];
    var _prevEntries = [];
    var _currentEntries = [];
    var _afterEntries = [];
    var _ready = false;

    // TODO: Setup event listeners
    function CreateEntryElement (entry) {
        var liElement = document.createElement("li");
        var btnElement = document.createElement("button");
        
        btnElement.setAttribute("id", "entry-" + entry.uid);
        btnElement.setAttribute("class", "MButton");
        btnElement.innerHTML = `[${entry.uid}] - ${entry.date.toLocaleString()}`;
        liElement.appendChild(btnElement);

        // Event listener for updating the event
        liElement.addEventListener("click", () => {
            _GoToUpdateEntry(entry);
        });
        
        return liElement;
    }

    function _GetNextEntry () {
        if (_afterEntries.length > 0) {
            _currentEntries.push(_afterEntries.shift());
            _position++;

            // Create the element and append it to the list
            var nextEntry = CreateEntryElement(_currentEntries[_currentEntries.length - 1]);
            document.getElementById("entriesContainer").appendChild(nextEntry);
        }
    }

    function _GetPrevEntry () {
        if (_prevEntries.length > 0) {
            _currentEntries.unshift(_prevEntries.pop());
            _position--;

            // Create the element and prepend it to the list
            var prevEntry = CreateEntryElement(_currentEntries[0]);
            document.getElementById("entriesContainer").prepend(prevEntry);
        }
    }

    function _RemoveLastEntry () {
        if (_currentEntries.length > 0) {
            _afterEntries.unshift(_currentEntries.pop());
            document.getElementById("entriesContainer").removeChild(document.querySelector("#entriesContainer li:last-child"));
        }
    }

    function _RemoveFirstEntry () {
        if (_currentEntries.length > 0) {
            _prevEntries.push(_currentEntries.shift());
            document.getElementById("entriesContainer").removeChild(document.querySelector("#entriesContainer li:first-child"));
        }
    }

    function _viewEntry (entry) {
        document.getElementById("entryDate").value = entry.date.toISOString().slice(0, -5);
        document.getElementById("entryBody").value = entry.body;
        // TODO: Setup seperate table for tracking tags and functions for adding removing tags from that table
        var select = document.getElementById("existingEntryTags");
        entry.tags.forEach(function (tag) {
            let option = document.createElement("option");
            option.innerHTML = tag;
        });

        document.getElementById("saveChanges").addEventListener("click", () => {
            document.getElementById("saveChanges").removeEventListener("click", database.UpdateEntryInDB);
            var newDate = Date.parse(document.getElementById("entryDate").value);
            document.getElementById("entryDate").value = "";
            var newBody = document.getElementById("entryBody").value;
            document.getElementById("entryBody").value = "";
            entry.date = newDate;
            entry.body.text = newBody;
        });
    }

    this.GetIncrement = function () {
        return _increment;
    };
    this.SetIncrement = function (x) {
        _increment = x;
    };
    
    this.GetPosition = function () {
        return _position;
    };
    this.SetPosition = function (x) {
        _position = x;
    };

    this.UpdateEntries = _UpdateEntries;
    function _UpdateEntries () {
        if (document.querySelectorAll("#entriesContainer").length < 1) {
            return;
        }
        _ready = false;
        database
            .GetAllEntriesFromDB()
            .then(function (newEntries) {
                _allEntries = newEntries;
                
                // Set max & min
                _min = 0;
                _max = _allEntries.length;
                
                // TODO: Check to see if any new entries need to be added to the screen

                // Update _prevEntries, _currentEntries, and _afterEntries
                _prevEntries = _allEntries.slice(0, _position);
                _currentEntries = _allEntries.slice(_position, _increment);
                _afterEntries = _allEntries.slice(_position + _increment)

                // Clear the current entry elements
                document.getElementById("entriesContainer").innerHTML = "";

                // Create the elements in _currentEntries
                _currentEntries.forEach(function (entry) {
                    var entryEl = CreateEntryElement(entry);
                    entryEl.addEventListener("click", () => {
                        _viewEntry(entry);
                    });
                    document.getElementById("entriesContainer").appendChild(entryEl);
                });
            });
    };

    this.GetNextEntries = function () {
        _ready = false;
        var limit = _currentEntries.length;
        for (var i = 0; i < limit && _afterEntries.length > 0; i++) {
            _RemoveFirstEntry();
            _GetNextEntry();
        };

        while (_currentEntries.length < _increment && _afterEntries.length > 0) {
            _GetNextEntry();
        }

        _ready = true;
    };

    this.GetPrevEntries = function () {
         _ready = false;
        var limit = _currentEntries.length;
        for (var i = 0; i < limit; i++) {
            _RemoveLastEntry();
            _GetPrevEntry();
        };

        while (_currentEntries.length < _increment && _afterEntries.length > 0) {
            _GetNextEntry();
        }

        _ready = true;
    }

    // ----- CRUD Functions for entries ----- //

    // Create new entry
    this.CreateNewEntry = _CreateNewEntry;
    function _CreateNewEntry (datetime, body, tags) {
        return _GenerateRandomUID()
            .then(function (newUid) {
                let entry = new Entry();
                entry.date = datetime;
                entry.body.text = body;
                entry.tags = tags;
                entry.uid = newUid;

                database.AddEntryToDB(entry).then(function () {
                    console.log("Added entry");
                });
            })
    }

    // Retrieve entry - Don't think i need this...
    this.RetrieveEntry = _RetrieveEntry;
    function _RetrieveEntry () {

    }

    // Update entry
    this.GoToUpdateEntry = _GoToUpdateEntry;
    function _GoToUpdateEntry (entryObj) {
        // TODO: Display secondary loading screen for this functions duration

        var titleEl = document.getElementById("entryTitle");
        var dateEl = document.getElementById("entryDate");
        var bodyEl = document.getElementById("entryBody");
        var tagsEls = document.getElementById("entryTags");
        var updateBtn = document.getElementById("saveChanges");

        function createTagElement (tag) {
            // TODO: Set event listeners for removing/updating the tag
            var tagBtnEl = document.createElement("button");

            tagBtnEl.innerHTML = tag;

            return tagBtnEl;
        }

        database
            .GetEntryInDB(entryObj.uid)
            .then(function (entry) {
                console.log(entry);
                // Set tags, date, body
                var d = new Date(entry.date).toISOString().slice(0, -5);
                dateEl.value = d;
                bodyEl.value = entry.body.text;

                // Set tags
                entry.tags.forEach(function (tag) {
                    var tagEl = createTagElement(tag);
                    tagsEls.appendChild(tagEl);
                });

                updateBtn.setAttribute("data-bind", entry.uid);
            });
    }

    // Delete entry
    this.DeleteEntry = _DeleteEntry;
    function _DeleteEntry () {

    }

    // ----- END CRUD Functions for entries ----- //

    this.UpdateTagFilters = function () {
        if (document.querySelectorAll("#filterableTags").length > 0) {
            database.GetAllTags()
                .then(function (uniqueTags) {
                    var tagEls = document.getElementById("filterableTags");
                    uniqueTags.forEach(function (tag) {
                        let liEl = document.createElement("li");
                        var checkboxEl = common.CreateMCheckbox(tag);
                        
                        liEl.innerText = tag;
                        
                        liEl.appendChild(checkboxEl);
                        tagEls.appendChild(liEl);
                    });
                });
        }
    }

    // Initialize _min, _max, and _allEntries. Also hide loading screen
    _UpdateEntries();
    initialize.push(this.UpdateTagFilters);
});

// WIP: This anon function will attach the needed event listeners that will paginate
// the entries list
(function(){
    if (document.querySelectorAll("#viewNextEntries").length > 0) {
        // View previous/next entries
        document.getElementById("viewNextEntries").addEventListener("click", connector.GetNextEntries);
        document.getElementById("viewPrevEntries").addEventListener("click", connector.GetPrevEntries);
    }
})();

// ----- Test functions ------ //

// Creating rand entries connector
function TestFunctions () {
    if (document.querySelectorAll("#testFunctionContainer").length > 0) {

        // Create random entries input
        document
            .getElementById("startCreatingRandEntries")
            .addEventListener("click", () => {
                var input = document.getElementById("createRandomEntries").value;
                common.ShowPrimaryLoading();
                database.CreateRandEntries(input)
                    .then(function (entries) {
                        common.DisplayAlert(JSON.stringify(entries));
                        common.HidePrimaryLoading();
                        connector.UpdateEntries();
                    });
            });

        // Clear out the database
        document
            .getElementById("removeAllEntries")
            .addEventListener("click", () => {
                common.ShowPrimaryLoading();
                database.RemoveAllEntriesInDB()
                    .then(function () {
                        common.HidePrimaryLoading();
                        common.DisplayAlert("Removed all entries in the db");
                    });
            });

        // View all entries
        document
            .getElementById("viewAllEntries")
            .addEventListener("click", () => {
                database
                    .GetAllEntriesFromDB()
                    .then(function (entries) {
                        document.getElementById("allEntries").innerHTML = (JSON.stringify(entries, null, 2));
                    });
            });
    }
}

// ----- END Test functions ------