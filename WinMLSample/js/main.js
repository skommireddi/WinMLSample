﻿(function () {

    var tabNames = { CameraCapture: "capturetab", PhotoUpload: "uploadtab" };
    var currentTab = tabNames.CameraCapture;
    var model = null;   

    if (window.Windows) {
        Windows.UI.WebUI.WebUIApplication.addEventListener('activated', async function (args) {

            document.getElementById("capturetabheader").addEventListener("click", function () { loadTab('capturetab'); });
            document.getElementById("uploadtabheader").addEventListener("click", function () { loadTab('uploadtab'); });

            registerTabs();
        });

        Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", onresuming);
    }

    function onresuming() {
        if (currentTab === tabNames.CameraCapture) {
            loadTab(tabNames.CameraCapture);
        }
    }

    function registerTabs() {
        loadcapturetabElements();
        loaduploadtabElements();

        loadTab(currentTab);
    }

    function loadTab(tabName) {

        closeTabs();
        clearLog();
        switch (tabName) {

            case tabNames.CameraCapture:
                startWebcam();
                document.getElementById("capturetabheader").className += " active";
                break;
            case tabNames.PhotoUpload:
                stopWebcam();
                document.getElementById("uploadtabheader").className += " active";
                break;
        }

        currentTab = tabName;
        document.getElementById(tabName).style.display = "inline-block";
    }

    function closeTabs() {
        var tabinput = document.getElementsByClassName("tabinput");
        for (i = 0; i < tabinput.length; i++) {
            tabinput[i].style.display = "none";
        } 

        var tabheader = document.getElementsByClassName("tabheader");
        for (i = 0; i < tabheader.length; i++) {
            tabheader[i].className = tabheader[i].className.replace(" active", "");
        } 
    }    

    async function loaduploadtabElements() {
        document.getElementById("uploadbutton").addEventListener("click", async function () {
            clearLog();
            var picker = new Windows.Storage.Pickers.FileOpenPicker();
            picker.viewMode = Windows.Storage.Pickers.PickerViewMode.Thumbnail;
            picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.PicturesLibrary;
            picker.fileTypeFilter.push(".jpg");
            picker.fileTypeFilter.push(".jpeg");
            picker.fileTypeFilter.push(".png");

            var file = await picker.pickSingleFileAsync();
            if (file !== null) {                
                var reader = new FileReader();
                var image = document.getElementById("uploadedphoto");

                reader.addEventListener("load", async function () {
                    var imageUrl = reader.result;
                    image.src = imageUrl;
                    logMessage("Photo uploaded.");

                    if (model === null) {
                        model = await loadModel();
                    }

                    var canvas = document.getElementById("outputcanvas");
                    canvas.width = image.width;
                    canvas.height = image.height;
                    var image416x416 = formatImage(image);
                    logMessage("Evaluating...");

                    var boxes = await tinyyolomodel.evaluateAsync(image416x416);
                    logMessage("Objects detected = " + boxes.length );
                    renderImageOutput(canvas, boxes, image);
                    logMessage("Model inference completed.");
                }, false);

                reader.readAsDataURL(file);
            }
            else {
                // do nothing
                console.log("File is null");
            }
        });
    }    

    async function loadcapturetabElements() {
        if (model === null) {
            model = await loadModel();
        }

        // Capture photo on click
        document.getElementById("capturebutton").addEventListener("click", async function () {
            clearLog();
            var canvas = document.getElementById('capturedphoto');
            var video = document.getElementById('webcamvideo');
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
            var canvasContext = canvas.getContext('2d');
            canvasContext.drawImage(video, 0, 0, video.clientWidth, video.clientHeight);
            logMessage("Photo captured.");

            var image = new Image();
            image.src = canvas.toDataURL("image/png");

            var image416x416 = formatImage(video);
            logMessage("Evaluating...");
            var boxes = await tinyyolomodel.evaluateAsync(image416x416);
            logMessage("Objects detected = " + boxes.length);
            renderImageOutput(canvas, boxes, image);
            logMessage("Model inference completed.");
        });
    }

    function formatImage(input) {
        var imageSizeForYolo = 416;
        var canvasForYoloInput = document.createElement("CANVAS");
        canvasForYoloInput.width = imageSizeForYolo;
        canvasForYoloInput.height = imageSizeForYolo;
        var newcanvasContext = canvasForYoloInput.getContext('2d');
        newcanvasContext.drawImage(input, 0, 0, imageSizeForYolo, imageSizeForYolo);
        var imageUrl = canvasForYoloInput.toDataURL("image/png");
        var base64Image = imageUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
        return base64Image;
    }

    function startWebcam() {
        var video = document.getElementById('webcamvideo');
        // Get access to the camera!
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
            });
        }
    }

    function stopWebcam() {
        var video = document.getElementById('webcamvideo');
        video.pause();
    }

    async function loadModel() {
        //using tinyyolo v2 version which only works in RS5
        var yolo = "ms-appx:///Models/tiny_yolov2/tinyyolomodelv2.onnx";

        var modelUri = new Windows.Foundation.Uri(yolo);
        var file = await Windows.Storage.StorageFile.getFileFromApplicationUriAsync(modelUri);
        var model = await tinyyolomodel.createModelAsync(file);
        console.log("Log: Model Loaded " + model);
        return model;
    }

    function renderImageOutput(canvas, boxes, img) {

        var scaleWidth = img.width / 416;
        var scaleHeight = img.height / 416;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        boxes.forEach((box, index) => {
            ctx.beginPath();
            ctx.lineWidth = "3";
            ctx.strokeStyle = "blue";
            ctx.rect(box.x * scaleWidth, box.y * scaleHeight, box.width * scaleWidth, box.height * scaleHeight);
            ctx.stroke();
            ctx.font = "20px Verdana";
            ctx.fillStyle = "lightblue";
            ctx.fillText(box.label, (box.x + box.width / 4) * scaleWidth, (box.y + box.height / 4) * scaleHeight);
        });
    }

    function logMessage(msg) {
        var log = document.getElementById("outputlog");
        log.innerHTML = log.innerHTML + msg + "<br/>";
    }

    function clearLog() {
        var log = document.getElementById("outputlog");
        log.innerHTML = "";
    }

})();




