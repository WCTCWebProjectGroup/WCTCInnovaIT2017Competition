var journal = new function () {
    
    this.GetEditorHtml = function () {
        return $('#froala-editor').froalaEditor('html.get', true);
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
    
    var dateEl = document.getElementById("entryDate");
    var timeEl = document.getElementById("entryTime");
    var entryBody = document.getElementById("froala-editor");
    var entryTagList = document.getElementById("entryTags");
    var existingTagsSelectEl = document.getElementById("existingTags");

    var deleteEntryBtn = document.getElementById("existingTags");
    var discardChangesBtn = document.getElementById("discardChanges");
    var saveChangesBtn = document.getElementById("saveChanges");
    var shareEntryBtn = document.getElementById("shareEntry");
    var cameraBtn = document.getElementById("takePicture");
    

    if (Boolean(urlParams[0].split('=')[1]) == true) {
        // Creating new entry
        console.log("Creating new entry...");

        // Hide discardChangesBtn
        deleteEntryBtn.style.display = "none";

        // Set the date/time to today
        var today = new Date();
        dateEl.value = today.toISOString().slice(0, 10);
        timeEl.value = today.toISOString().slice(11, 19);

    } else if (Boolean(urlParams[0].split('=')[1]) == false) {
        // Editing existing entry
        console.log("Updating an existing entry...");
    } else {
        // Error occurred
        console.log("Error occurred...");
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
        database.CreateNewEntry(datetime, body, tags)
            .then(function () {
                document.location.assign("/calendar.html");
            });
    });
    // ----- Event Listeners ----- //
}

_journalInit();

// ----- END Event Listeners ----- //