var calendar = new function () {
    var _goodDates = [];
    
    function _showSidePanel(date) {
        document.getElementById("sidePanel").style.top = 0;
        console.log("_showSidePanel()" + date);
    }
    
    function _onDateClickHandler (date) {
        _showSidePanel(date);
    }

    common.ShowPrimaryLoading();
    database.GetAllEntriesFromDB()
        .then(function (entries) {
            entries.forEach(function (entry) {
                var cleanDate = entry.date.toISOString().slice(0, 10);
                var entry = {
                    name: 'entry',
                    date: cleanDate
                }
                if (!_goodDates.includes(cleanDate))
                    _goodDates.push(entry);
            });
            
            $('.calendar').pignoseCalendar({
                select: _onDateClickHandler,
                scheduleOptions: {
                    colors: {
                        offer: '#2fabb7',
                        ad: '5c6270'
                    }
                },
                schedules: _goodDates
            });

            document.getElementById("newEntry").addEventListener("click", ()=>{
                window.location.href = '/journal.html?newentry=true';
            });
        })
}