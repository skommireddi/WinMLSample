if (window.Windows) {
    Windows.UI.WebUI.WebUIApplication.addEventListener('activated', function (args) {
      
        var mystr1 = WinMLBridge.Bridge.hello();

        console.log(mystr1);
    });
}
