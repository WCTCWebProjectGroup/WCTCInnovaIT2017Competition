initialize.push(TestFunctions);

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
        var content = document.createElement("div");
        var editBtn = document.createElement("input");
        var shareBtn = document.createElement("input");
        
        btnElement.setAttribute("id", "entry-" + entry.uid);
        btnElement.setAttribute("class", "MButton");
        btnElement.innerHTML = `[${entry.uid}] - ${entry.date.toLocaleString()}`;

        editBtn.value = "Edit/View Entry";
        editBtn.addEventListener("click", function () {
            console.log('wip');
        });
        
        liElement.appendChild(btnElement);

        // Event listener for updating the event
        liElement.addEventListener("click", () => {
            calendar.ShowShareModalForEntries(entry);
        });
        
        return liElement;
    }

    function _GetNextEntry () {
        if (_afterEntries.length > 0) {
            _currentEntries.push(_afterEntries.shift());
            _position++;

            // Create the element and append it to the list
            var nextEntry = calendar.CreateEntryCardElement(_currentEntries[_currentEntries.length - 1]);
            document.getElementById("entriesContainer").appendChild(nextEntry);
        }
    }

    function _GetPrevEntry () {
        if (_prevEntries.length > 0) {
            _currentEntries.unshift(_prevEntries.pop());
            _position--;

            // Create the element and prepend it to the list
            var prevEntry = calendar.CreateEntryCardElement(_currentEntries[0]);
            document.getElementById("entriesContainer").prepend(prevEntry);
        }
    }

    function _RemoveLastEntry () {
        if (_currentEntries.length > 0) {
            _afterEntries.unshift(_currentEntries.pop());
            document.getElementById("entriesContainer").removeChild(document.querySelector("#entriesContainer > *:last-child"));
        }
    }

    function _RemoveFirstEntry () {
        if (_currentEntries.length > 0) {
            _prevEntries.push(_currentEntries.shift());
            document.getElementById("entriesContainer").removeChild(document.querySelector("#entriesContainer > *:first-child"));
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

    function _UpdateEntries () {
        if (document.querySelectorAll("#entriesContainer").length < 1) {
            return;
        }

        // Get all filters first
        var filterableTags = document.getElementById("filterableTags");
        var filterAfterDate = document.getElementById("filterAfterDate");
        var filterBeforeDate = document.getElementById("filterBeforeDate");

        var filterTags = [];
        var beforeDate = filterBeforeDate.value != "" ? true : false;
        var afterDate = filterAfterDate.value != "" ? true : false;

        filterableTags.querySelectorAll("input").forEach(function (input) {
            if (input.checked) {
                var cleanName = input.getAttribute("id")
                    .replace("MCheckbox", "")
                    .replace("_", " ");
                if (!filterTags.includes(cleanName))
                    filterTags.push(cleanName);
            }
        });

        _ready = false;
        database
            .GetAllEntriesFromDB()
            .then(function (newEntries) {
                newEntries = newEntries.reverse();

                // Apply tag filters
                if (filterTags.length > 0) {
                    newEntries = newEntries.filter(function (entry) {
                        return entry.tags.some(function (tag) {
                            return filterTags.includes(tag)
                        });
                    });
                }

                // Apply before date filters
                if (beforeDate) {
                    var cleanBeforeDate = new Date(filterBeforeDate.value);
                    newEntries = newEntries.filter(function (entry) {
                        return entry.date < cleanBeforeDate;
                    });
                }

                // Apply after date filters
                if (afterDate) {
                    var cleanAfterDate = new Date(filterAfterDate.value);
                    newEntries = newEntries.filter(function (entry) {
                        return entry.date > cleanAfterDate;
                    });
                }

                if (_allEntries != newEntries)
                    _position = 0;

                _allEntries = newEntries;

                if (_allEntries.length == 0)
                    common.DisplayAlert("No search results!");
                
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
                    var entryEl = calendar.CreateEntryCardElement(entry);
                    document.getElementById("entriesContainer").appendChild(entryEl);
                });
            });

        _ready = true;
    };
    this.UpdateEntries = _UpdateEntries;

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
        document.location.assign("/journal.html?newEntry=false&entryID=" + entryObj.uid);

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
                        
                        // liEl.innerText = tag;
                        
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

        if (document.querySelectorAll("#applyFilters").length > 0) {
            document.getElementById("applyFilters").addEventListener("click", connector.UpdateEntries);
        }
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

// ----- END Test functions ------ //