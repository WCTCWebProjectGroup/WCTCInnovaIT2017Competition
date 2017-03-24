function HasInternetCapabilities () {
    document.addEventListener("offline", () => {
        console.log("No internet connection");
    }, false);
    document.addEventListener("online", () => {
        console.log("Established internet connection");
    }, false);
}