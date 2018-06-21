// loadModelFromStorageFileAsync() throws error
(async () => {
    var installedLoc = Windows.ApplicationModel.Package.current.installedLocation;
    var modelsFolder = await installedLoc.getFolderAsync("Models");
    var tiniyolovFolder = await modelsFolder.getFolderAsync("tiny_yolov2");
    var modelFile = await tiniyolovFolder.getFileAsync("tiny_yolov2.onnx");
    var model = await Windows.AI.MachineLearning.Preview.LearningModelPreview.loadModelFromStorageFileAsync(modelFile);
    console.log(model.description);
})();


// loadModelFromStorageFileAsync() does not throw error, it doesn't create model as expected
//var modelFile = Windows.ApplicationModel.Package.current.installedLocation
//    .getFolderAsync("Models")
//    .then((folder) => folder.getFolderAsync("tiny_yolov2"))
//    .then((folder) => folder.getFileAsync("tiny_yolov2.onnx"))
//    .then((file) => Windows.AI.MachineLearning.Preview.LearningModelPreview.loadModelFromStorageFileAsync(file),
//           error => console.log(error)
//    )
//    .then((model) => console.log(model), error => console.log(error), progress => console.log("loading"));


// loadModelFromStorageFileAsync() throws error

//var modelFile = Windows.ApplicationModel.Package.current.installedLocation
//    .getFolderAsync("Models")
//    .then((folder) => folder.getFolderAsync("tiny_yolov2"))
//    .then((folder) => folder.getFileAsync("tiny_yolov2.onnx"))
//    .then((file) => {
//        Windows.AI.MachineLearning.Preview.LearningModelPreview.loadModelFromStorageFileAsync(file)
//            .then(model => console.log(model), error => console.log(error));        
//        }
//    );







