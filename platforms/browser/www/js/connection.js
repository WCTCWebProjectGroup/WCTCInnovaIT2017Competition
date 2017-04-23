common.initialize.push(HasInternetCapabilities);
function HasInternetCapabilities () {
    document.addEventListener("offline", function () {
        console.log("No internet connection");
    }, false);
    document.addEventListener("online", function () {
        console.log("Established internet connection");
    }, false);
}