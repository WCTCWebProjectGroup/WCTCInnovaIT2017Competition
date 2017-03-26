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

    // ----- End Constructors ----- //

    var _db = {};
    function _createCalendar() {
        // Default Calendar
        $('.calendar').pignoseCalendar({
            //select: onClickHandler,
            //enabledDates: goodDates
        });
    }

    // Initialize the calendar when ready
    initialize.push(_createCalendar);

    function _DB_name () {
        return "TripMySchoolJournalDB";
    }

    // Setup database
    (function () {
        _db = new Dexie(_DB_name());

        return _db.version(1).stores({
            Entries: 'uid, date, body, tags'
        });
    })();

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

    // Updates an entry from the db based on the uid
    this.UpdateEntryInDB = function (entry) {
        return _db.Entries
            .where('uid')
            .equals(entry._uid)
            .modify({
                date: entry._date,
                body: entry._body,
                tags: entry._tags
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
                    entry.body.text = RandFirstName() + " " + RandLastName() + " " + RandBody();
                    entry.tags[0] = RandTag();
                    entry.tags[1] = RandTag();
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

    console.log("Finished adding entries to the db");
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
                    document.getElementById("entriesContainer").appendChild(entryEl);
                });
            });
    };

    this.GetNextEntries = function () {
        _ready = false;
        var limit = _currentEntries.length;
        for (var i = 0; i < limit; i++) {
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
    this.GoToCreateNewEntry = _GoToCreateNewEntry;
    function _GoToCreateNewEntry () {

    }

    // Retrieve entry - Don't think i need this...
    this.RetrieveEntry = _RetrieveEntry;
    function _RetrieveEntry () {

    }

    // Update entry
    this.GoToUpdateEntry = _GoToUpdateEntry;
    function _GoToUpdateEntry (entryUID) {
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
            .GetEntryInDB(entryUID)
            .then(function (entry) {
                // Set title, date, body
                titleEl.value = `[${entry.uid}] - ${entry.date}`;
                dateEl.value = entry.date;
                bodyEl.value = entry.body;

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

    // Initialize _min, _max, and _allEntries. Also hide loading screen
    _UpdateEntries();
});

// WIP: This anon function will attach the needed event listeners that will paginate
// the entries list
(function(){
    // View previous/next entries
    document.getElementById("viewNextEntries").addEventListener("click", connector.GetNextEntries);
    document.getElementById("viewPrevEntries").addEventListener("click", connector.GetPrevEntries);

    // Create new entry
    document.getElementById("createNewEntry").addEventListener("click", connector.GoToCreateNewEntry);

    // Retrieve entry?

    // Update entry
    document.getElementById("saveChanges").addEventListener("click", () => {
        
    });
})();

// ----- Test functions ------

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