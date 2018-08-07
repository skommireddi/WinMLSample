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
using Windows.Storage.Streams;
using System.Linq;

// d224f87054234871a169eda0b7463d86

namespace WinMLBridge
{
    public sealed class D224f87054234871a169eda0b7463d86ModelInput
    {
        public VideoFrame videoFrame { get; set; }
    }

    public sealed class D224f87054234871a169eda0b7463d86ModelOutput
    {
        public IList<float> grid { get; set; }
        public D224f87054234871a169eda0b7463d86ModelOutput()
        {
            grid = new List<float>(new float[21125]);
        }
    }

    public sealed class D224f87054234871a169eda0b7463d86Model
    {
        private LearningModelPreview learningModel;

        public static string CheckBridge()
        {
            return "Can reach bridge";
        }

        public static IAsyncOperation<D224f87054234871a169eda0b7463d86Model> CreateModelAsync(Uri modelUri)
        {
            // return Task.Run(async () => { return await CreateD224f87054234871a169eda0b7463d86Model(filePath); }).AsAsyncOperation();
            return CreateD224f87054234871a169eda0b7463d86Model(modelUri).AsAsyncOperation();
        }

        public IAsyncOperation<D224f87054234871a169eda0b7463d86ModelOutput> EvaluateModelAsync(string imageBase64Encoded)
        {
           return EvaluateAsync(imageBase64Encoded).AsAsyncOperation(); 
        }

        private async static Task<D224f87054234871a169eda0b7463d86Model> CreateD224f87054234871a169eda0b7463d86Model(Uri modelUri)
        {
            StorageFile file = await StorageFile.GetFileFromApplicationUriAsync(modelUri);
            LearningModelPreview learningModel = await LearningModelPreview.LoadModelFromStorageFileAsync(file);
            D224f87054234871a169eda0b7463d86Model model = new D224f87054234871a169eda0b7463d86Model();
            model.learningModel = learningModel;
            return model;
        }

        private async Task<D224f87054234871a169eda0b7463d86ModelOutput> EvaluateAsync(string imageBase64Encoded)
        {

            var imageBytes = Convert.FromBase64String(imageBase64Encoded);
            var memoryStream = new MemoryStream(imageBytes);
            BitmapDecoder bitDecoder = await BitmapDecoder.CreateAsync(memoryStream.AsRandomAccessStream());
            var softwareBitmap = await bitDecoder.GetSoftwareBitmapAsync();
            var videoFrame = VideoFrame.CreateWithSoftwareBitmap(softwareBitmap);
            D224f87054234871a169eda0b7463d86ModelInput input = new D224f87054234871a169eda0b7463d86ModelInput
            {
                videoFrame = videoFrame
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

            D224f87054234871a169eda0b7463d86ModelOutput output = new D224f87054234871a169eda0b7463d86ModelOutput();
            LearningModelBindingPreview binding = new LearningModelBindingPreview(learningModel);
            binding.Bind(inputImageDescription.Name, input.videoFrame);
            binding.Bind(outputTensorDescription.Name, output.grid);
            LearningModelEvaluationResultPreview evalResult = await learningModel.EvaluateAsync(binding, string.Empty);
            return output;
        }
    }
}
