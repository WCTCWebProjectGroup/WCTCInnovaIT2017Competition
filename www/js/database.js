// Database functions and vars
// The app will use only ONE database, for now it will be called TripMySchoolJournalDB
// Needs to be included before index.js!

// *The database currently has the tables; 'Entries'

var database = new function () {
    var db;

    function DB_name () {
        return "TripMySchoolJournalDB";
    }

    // Setup database
    (function () {
        db = new Dexie(DB_name());

        return db.version(1).stores({
            Entries: 'uid, date, body, tags'
        });
    })();

    // Generates random uid
    function GenerateRandomUID () {
        return db.Entries
            .toArray()
            .then(function (arrayOfEntries) {
                return arrayOfEntries[arrayOfEntries.length - 1].uid + 1;
            });
    }

    function* idMaker() {
        var index = 0;
        while(true)
            yield index++;
    }


    // Adds an entry to the db
    this.AddEntryToDB = function (entry) {
        if (entry.uid == null)
            throw "Error: entry.uid was invalid!";
        if (entry.date == null)
            throw "Error: entry._date was invalid!";
        if (entry.body == null)
            throw "Error: entry_body was invalid!";
        if (entry.tags == null)
            throw "Error: entry._tags was invalid!";

        return GenerateRandomUID()
            .then(function(value) {
                db.Entries.add({
                    uid: value,
                    date: entry.date,
                    body: entry.body,
                    tags: entry.tags
                }).then(function () {
                    console.log("Added user to the db");
                }).catch(function (error) {
                    throw "Error occured while adding an entry to the db!";
                })
        });
    }

    // Gets all entries from the db
    this.GetAllEntriesFromDB = function () {
        return db.Entries.toArray();
    };

    // Gets one entry from the db based on the uid
    this.GetEntryInDB = function (uid) {
        return db.Entries
            .where('uid')
            .equals(uid);
    };

    // Updates an entry from the db based on the uid
    this.UpdateEntryInDB = function (entry) {
        return db.Entries
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
        return db.Entries
            .clear()
            .then(function () {
                console.log("Finished clearing the db");
            });
    }

    // Removes one entry from the db based on the uid
    this.RemoveEntryFromDB = function (uid) {
        return db.Entries
            .delete(uid)
            .then(function () {
                console.log("Deleted entry");
            });
    }
}

// ----- Constructors ----- //

function Entry () {
    this.uid = Date.now();
    this.date = new Date();
    this.body = {};
    this.tags = [];
}

// ----- End Constructors ----- //

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
}

function CreateRandEntries (numToCreate) {
    for (var i = 0; i < numToCreate; i++) {
        let entry = new Entry();
        entry.body.text = RandFirstName() + " " + RandLastName() + " " + RandBody();
        entry.tags[0] = RandTag();
        entry.tags[1] = RandTag();

        database.AddEntryToDB(entry).then(function () {
            console.log("Added entry");
        });
    }

    console.log("Finished adding entries to the db");
}