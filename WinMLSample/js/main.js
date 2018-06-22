if (window.Windows) {
    Windows.UI.WebUI.WebUIApplication.addEventListener('activated', function (args) {

        var mystr = WinRTBridgeComponent.Bridge.getAnswerStatic();
        var bridge = new WinRTBridgeComponent.Bridge();
        console.log(bridge.getAnswer());
    });
}
