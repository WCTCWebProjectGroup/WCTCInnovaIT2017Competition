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

    // ----- End Constructors ----- //

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

        return db.transaction('rw', db.Entries, function () {
                db.Entries.add({
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
        return db.Entries.toArray();
    };

    // Gets one entry from the db based on the uid
    this.GetEntryInDB = function (uid) {
        return db.Entries
            .where('uid')
            .equals(uid)
            .first();
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
        db.Entries
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

    // Enters dummy entries into the database
    this.CreateRandEntries = function (numToCreate) {
        let promises = [];
    
        GenerateRandomUID()
            .then(function (newUid) {
                for (var i = 0; i < numToCreate; i++) {
                    let entry = new Entry();
                    entry.body.text = RandFirstName() + " " + RandLastName() + " " + RandBody();
                    entry.tags[0] = RandTag();
                    entry.tags[1] = RandTag();
                    entry.uid = i + newUid;

                    promises.push(database.AddEntryToDB(entry).then(function () {
                        console.log("Added entry");
                    }));
                }
            }).then(function () {
                Promise.all(promises).then(function () {
                    console.log("Finished adding entries to the db");
                });
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