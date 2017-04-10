// Database functions and vars
// The app will use only ONE database, for now it will be called TripMySchoolJournalDB
// Needs to be included before index.js!

// *The database currently has the tables; 'Entries'

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
