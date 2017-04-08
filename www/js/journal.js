var journal = new function () {
    
    this.GetEditorHtml = function () {
        return $('#froala-editor').froalaEditor('html.get', true);
    }

    this.SetEditorHtml = function (html) {
        return $('#froala-editor').froalaEditor('html.set', html);
    }
}

// ----- Event Listeners ----- //

function _journalInit () {
    if (document.querySelectorAll("#froala-editor").length > 0) {
        $(function() { $("#froala-editor").froalaEditor({
            height: 200
        }) });
    }

    // First determine if creating a new entry or editing an exisiting one
    var urlParams = document.location.search.replace('?', '').split('&');
    var creatingNewEntry = false;
    
    var dateEl = document.getElementById("entryDate");
    var timeEl = document.getElementById("entryTime");
    var entryBody = document.getElementById("froala-editor");
    var entryTagList = document.getElementById("entryTags");
    var existingTagsSelectEl = document.getElementById("existingTags");
    var _db_entry = {};

    var deleteEntryBtn = document.getElementById("existingTags");
    var discardChangesBtn = document.getElementById("discardChanges");
    var saveChangesBtn = document.getElementById("saveChanges");
    var shareEntryBtn = document.getElementById("shareEntry");
    var cameraBtn = document.getElementById("takePicture");
    

    if (urlParams[0].split('=')[1] == "true") {
        // Creating new entry
        console.log("Creating new entry...");
        creatingNewEntry = true;

        // Hide discardChangesBtn
        deleteEntryBtn.style.display = "none";

        // Set the date/time to today
        var today = new Date();
        dateEl.value = today.toISOString().slice(0, 10);
        timeEl.value = today.toISOString().slice(11, 19);

    } else if (urlParams[0].split('=')[1] == "false") {
        // Editing existing entry
        console.log("Updating an existing entry...");
        
        var editingEntryNumber = Number(urlParams[1].split('=')[1]);
        console.log("Editing " + editingEntryNumber);
        database.GetEntryInDB(Number(editingEntryNumber))
            .then(function (entry) {
                _db_entry = entry;

                // Set date/time
                dateEl.value = entry.date.toISOString().slice(0, 10);
                timeEl.value = entry.date.toISOString().slice(11, 19);

                // Set body
                journal.SetEditorHtml(entry.body.text);

                // TODO: Set Tags
            });
    } else {
        // Error occurred
        document.location.assign("/calendar.html");
    }


    // ----- Event Listeners ----- //
    cameraBtn.addEventListener("click", function () {
        console.log("Taking a picture is still a WIP!");
    });
    discardChangesBtn.addEventListener("click", function () {
        console.log("Discarding changes");
        document.location.assign("/calendar.html");
    });
    saveChangesBtn.addEventListener("click", function () {
        common.ShowPrimaryLoading();
        console.log("Saving entry")
        var datetime = new Date(dateEl.value);
        datetime.setHours( timeEl.value.slice(0,2));
        datetime.setMinutes(timeEl.value.slice(3, 5));
        datetime.setSeconds(timeEl.value.slice(6, 8));
        var body = journal.GetEditorHtml();
        var tags = [];
        if (creatingNewEntry) {
            database.CreateNewEntry(datetime, body, tags)
                .then(function () {
                    document.location.assign("/calendar.html");
                });
        } else {
            _db_entry.body.text = journal.GetEditorHtml();

            var datetime = new Date(dateEl.value);
            datetime.setHours( timeEl.value.slice(0,2));
            datetime.setMinutes(timeEl.value.slice(3, 5));
            datetime.setSeconds(timeEl.value.slice(6, 8));

            // TODO: Tags
            // _db_entry

            database.UpdateEntryInDB(_db_entry)
                .then(function () {
                    document.location.assign("/calendar.html");
                });
        }
    });
    // ----- Event Listeners ----- //
}

initialize.push(_journalInit);

// ----- END Event Listeners ----- //