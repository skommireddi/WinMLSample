using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Storage;
using Windows.AI.MachineLearning.Preview;
using Windows.Foundation;
using System.Runtime.InteropServices.WindowsRuntime;

// d224f87054234871a169eda0b7463d86

namespace WinMLBridge
{
    public sealed class D224f87054234871a169eda0b7463d86ModelInput
    {
        public VideoFrame image { get; set; }
    }

    public sealed class D224f87054234871a169eda0b7463d86ModelOutput
    {
        public IList<double> grid { get; set; }
        public D224f87054234871a169eda0b7463d86ModelOutput()
        {
            this.grid = new List<double>();
        }
    }

    public sealed class D224f87054234871a169eda0b7463d86Model
    {
        private LearningModelPreview learningModel;

        public static string CheckBridge()
        {
            return "Can reach bridge";
        }

        public static IAsyncOperation<D224f87054234871a169eda0b7463d86Model> CreateModelAsync(Uri filePath)
        {
            return Task.Run(async () => { return await CreateD224f87054234871a169eda0b7463d86Model(filePath); }).AsAsyncOperation();           
        }

        public IAsyncOperation<D224f87054234871a169eda0b7463d86ModelOutput> EvaluateModelAsync(D224f87054234871a169eda0b7463d86ModelInput input)
        {
            return Task.Run(async () => { return await EvaluateAsync(input); }).AsAsyncOperation();

            // return AsyncInfo.Run(async _ => await EvaluateAsync(input)); this doesn't work 
        }

        private async static Task<D224f87054234871a169eda0b7463d86Model> CreateD224f87054234871a169eda0b7463d86Model(Uri filePath)
        {
            StorageFile file = await StorageFile.GetFileFromApplicationUriAsync(filePath);
            LearningModelPreview learningModel = await LearningModelPreview.LoadModelFromStorageFileAsync(file);
            D224f87054234871a169eda0b7463d86Model model = new D224f87054234871a169eda0b7463d86Model();
            model.learningModel = learningModel;
            return model;
        }

        private async Task<D224f87054234871a169eda0b7463d86ModelOutput> EvaluateAsync(D224f87054234871a169eda0b7463d86ModelInput input) {
            D224f87054234871a169eda0b7463d86ModelOutput output = new D224f87054234871a169eda0b7463d86ModelOutput();
            LearningModelBindingPreview binding = new LearningModelBindingPreview(learningModel);
            binding.Bind("image", input.image);
            binding.Bind("grid", output.grid);
            LearningModelEvaluationResultPreview evalResult = await learningModel.EvaluateAsync(binding, string.Empty);
            return output;
        }
    }
}
