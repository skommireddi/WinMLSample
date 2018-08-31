﻿var tabNames = { CameraCapture: "capturetab", PhotoUpload: "uploadtab" };
var currentTab = tabNames.CameraCapture;
var model = null;
var log = document.getElementById("outputlog");

function openTab(tabName) {
    tabinput = document.getElementsByClassName("tabinput");
    for (i = 0; i < tabinput.length; i++) {
        tabinput[i].style.display = "none";
        var canvas = document.getElementById("outputcanvas");
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    loadTab(tabName); 
}

if (window.Windows) {
    Windows.UI.WebUI.WebUIApplication.addEventListener('activated', async function (args) {

        var check = WinMLBridge.YoloModel.checkBridge();
        console.log("Log:" + check);

        document.getElementById("capturetabheader").addEventListener("click", function () { openTab('capturetab'); });
        document.getElementById("uploadtabheader").addEventListener("click", function () { openTab('uploadtab'); });

        openTab(currentTab);
    });

    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", onresuming);
}


function onresuming() {
    var video = document.getElementById("webcamvideo");
    if (currentTab === tabNames.CameraCapture) {
        loadTab(tabNames.CameraCapture);
    }
}

function loadTab(tabName) {

    switch (tabName) {

        case tabNames.CameraCapture:
            startWebcam();            
            loadcapturetabElements();
            break;
        case tabNames.PhotoUpload:
            stopWebcam();
            loaduploadtabElements();
            break;
    } 

    currentTab = tabName;
    document.getElementById(tabName).style.display = "inline-block";
}

async function loaduploadtabElements() {
    document.getElementById("uploadbutton").addEventListener("click", async function() {      

        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.Thumbnail;
        picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.PicturesLibrary;
        picker.fileTypeFilter.push(".jpg");
        picker.fileTypeFilter.push(".jpeg");
        picker.fileTypeFilter.push(".png");

        var canvas = document.getElementById("outputcanvas");
        var file = await picker.pickSingleFileAsync();
        if (file !== null) {

            var base64Image = "";
            var reader = new FileReader();
            var image = document.getElementById("uploadedphoto");  

            reader.addEventListener("load", async function () {
                var imageUrl = reader.result;
                image.src = imageUrl;
                base64Image = imageUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                if (model === null) {
                    model = await loadModel();
                }

                canvas.width = image.width;
                canvas.height = image.height;

                base64Image = formatImage(image);

                var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);
                renderImageOutput(canvas, boxes, image);

            }, false);

            if (file) {
                reader.readAsDataURL(file);
            }           
        }
        else {
            // do nothing
        }       
    });
}

async function loadcapturetabElements() {

    if (model === null) {
        model = await loadModel();
    }

    // Trigger photo take
    document.getElementById("capturebutton").addEventListener("click", async function () {

        var canvas = document.getElementById('capturedphoto');
        var video = document.getElementById('webcamvideo');
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        var canvasContext = canvas.getContext('2d');

        canvasContext.drawImage(video, 0, 0, video.clientWidth, video.clientHeight);
        var image = new Image();
        image.src = canvas.toDataURL("image/png", );

        var image416x416 = formatImage(video);
        var boxes = await model.evaluateModelAndProcessOutputAsync(image416x416);
        renderImageOutput(canvas, boxes, image);
    });
}

function formatImage(input) {
    var imageSizeForYolo = 416;
    var canvasForYoloInput = document.createElement("CANVAS");
    canvasForYoloInput.width = imageSizeForYolo;
    canvasForYoloInput.height = imageSizeForYolo;
    var newcanvasContext = canvasForYoloInput.getContext('2d');
    newcanvasContext.drawImage(input, 0, 0, imageSizeForYolo, imageSizeForYolo);
    var imageUrl = canvasForYoloInput.toDataURL("image/png", );
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
    var yolo = "ms-appx:///Models/tiny_yolov2/TinyYOLO.onnx";

    var modelUri = new Windows.Foundation.Uri(yolo);
    var model = await WinMLBridge.YoloModel.createModelAsync(modelUri);
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
        ctx.rect(box.x * scaleWidth, box.y * scaleHeight, box.width * scaleWidth, box.height *scaleHeight);
        ctx.stroke();
        ctx.font = "20px Verdana";
        ctx.fillStyle = "lightblue";
        ctx.fillText(box.label, (box.x + box.width / 4) * scaleWidth, (box.y + box.height / 4) * scaleHeight);
    });
}




