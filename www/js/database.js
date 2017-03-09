// Database functions and vars
// The app will use only ONE database, for now it will be called TripMySchoolJournalDB
// Needs to be included before index.js!

// *The database currently has the tables; 'Entries'

// ----- New API using Dexie ----- //
// Global Vars - TODO: Put in anon-function

// ----- (1) Functions for setting up the database ----- //

var db;

// Return the database name
function DB_name () {
    return "TripMySchoolJournalDB";
}

// This is the function that sets up the database schema
function DB_init () {
    db = new Dexie(DB_name());

    return db.version(1).stores({
        Entries: 'uid, date, body, tags'
    });
}

// ----- (1) END ----- //

// ----- (2) Constructors ----- //
function NewEntry () {
    this._uid = Date.now();
    this._date = new Date();
    this._body = [];
    this._tags = [];
}

function Entry (date, body, tags) {
    this._uid = Date.now();
    this._date = date;
    this._body = body;
    this._tags = tags;
}

function EntryBody () {

}

// ----- (2) END ----- //

// ----- (3) Functions for adding/removing/modifying database ----- //
// Note: They all return promises

// Adds an entry to the db
function AddEntryToDB (entry) {
    if (entry._uid == null)
        throw "Error: entry.uid was invalid!";
    if (entry._date == null)
        throw "Error: entry._date was invalid!";
    if (entry._body == null)
        throw "Error: entry_body was invalid!";
    if (entry._tags == null)
        throw "Error: entry._tags was invalid!";

    return db.Entries.put({
        uid: entry._uid,
        date: entry._date,
        body: entry._body,
        tags: entry._tags
    }).catch(function (error) {
        throw "Error occured while adding an entry to the db!";
    });
}

// Gets all entries from the db
function GetAllEntriesFromDB () {
    return db.Entries.toArray();
};

// Gets one entry from the db based on the uid
function GetEntryInDB (uid) {
    return db.Entries
        .where('uid')
        .equals(uid);
};

// Updates an entry from the db based on the uid
function UpdateEntryInDB (entry) {
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
function RemoveAllEntriesInDB () {
    return db.Entries.clear();
}

// Removes one entry from the db based on the uid
function RemoveEntryFromDB (uid) {
    return db.Entries
        .delete(uid);
}

// ----- (3) END ----- //

// ----- (4) Init Database ----- //
DB_init();
// ----- (4) END ----- //