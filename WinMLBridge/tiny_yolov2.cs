using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Storage;
using Windows.AI.MachineLearning.Preview;
using Windows.Foundation;
using System.Runtime.InteropServices.WindowsRuntime;
using System.IO;
using Windows.Graphics.Imaging;
using System.Linq;

namespace WinMLBridge
{
    public sealed class YOLOModelInput
    {
        public VideoFrame InputVideoFrame { get; set; }
    }

    public sealed class YOLOModelOutput
    {
        public IList<float> Grid { get; set; }
        public YOLOModelOutput()
        {
            Grid = new List<float>(new float[21125]);
        }
    }

    public sealed class YoloModel
    {
        private LearningModelPreview learningModel;
        private YoloOutputParser parser;
        private YOLOModelInput input;

        public YoloModel()
        {
            parser = new YoloOutputParser();
        }

        public static string CheckBridge()
        {
            return "Connection to bridge successful";
        }

        public static IAsyncOperation<YoloModel> CreateModelAsync(Uri modelUri)
        {
            return CreateModel(modelUri).AsAsyncOperation();
        }

        public IAsyncOperation<YOLOModelOutput> EvaluateModelAsync(string imageBase64Encoded)
        {
           return EvaluateAsync(imageBase64Encoded).AsAsyncOperation();
        }

        public IAsyncOperation<IList<YoloBoundingBox>> EvaluateModelAndProcessOutputAsync(string imageBase64Encoded)
        {
            return EvaluateAndProcessOutputAsync(imageBase64Encoded).AsAsyncOperation();
        }

        private async Task<IList<YoloBoundingBox>> EvaluateAndProcessOutputAsync(string imageBase64Encoded) //, Windows.UI.Core.CoreDispatcher dispatcher)
        {
            var output = await EvaluateAsync(imageBase64Encoded);
            // process output
            var boxes = parser.ParseOutputs(output.Grid.ToArray(), .3F);

            if (boxes.Count > 0)
            {
                // Remove overalapping and low confidence bounding boxes
                boxes = parser.NonMaxSuppress(boxes, 5, .5F);
            }

            return boxes;
        }

        private async static Task<YoloModel> CreateModel(Uri modelUri)
        {
            StorageFile file = await StorageFile.GetFileFromApplicationUriAsync(modelUri);
            LearningModelPreview learningModel = await LearningModelPreview.LoadModelFromStorageFileAsync(file);
            YoloModel model = new YoloModel
            {
                learningModel = learningModel
            };
            return model;
        }

        private async Task<YOLOModelOutput> EvaluateAsync(string imageBase64Encoded)
        {
            var imageBytes = Convert.FromBase64String(imageBase64Encoded);
            var memoryStream = new MemoryStream(imageBytes);
            BitmapDecoder bitDecoder = await BitmapDecoder.CreateAsync(memoryStream.AsRandomAccessStream());
            var softwareBitmap = await bitDecoder.GetSoftwareBitmapAsync();
            var videoFrame = VideoFrame.CreateWithSoftwareBitmap(softwareBitmap);
            input = new YOLOModelInput
            {
                InputVideoFrame = videoFrame
            };         

            // Retrieve model input and output variable descriptions (we already know the model takes an image in and outputs a tensor)
            var inputFeatures = learningModel.Description.InputFeatures.ToList();
            var outputFeatures = learningModel.Description.OutputFeatures.ToList();

           var inputImageDescription =
                inputFeatures.FirstOrDefault(feature => feature.ModelFeatureKind == LearningModelFeatureKindPreview.Image)
                as ImageVariableDescriptorPreview;

            var outputTensorDescription =
                outputFeatures.FirstOrDefault(feature => feature.ModelFeatureKind == LearningModelFeatureKindPreview.Tensor)
                as TensorVariableDescriptorPreview;

            YOLOModelOutput output = new YOLOModelOutput();
            LearningModelBindingPreview binding = new LearningModelBindingPreview(learningModel);
            binding.Bind(inputImageDescription.Name, input.InputVideoFrame);
            binding.Bind(outputTensorDescription.Name, output.Grid);
            LearningModelEvaluationResultPreview evalResult = await learningModel.EvaluateAsync(binding, string.Empty);
            return output;
        }        
    }
}
