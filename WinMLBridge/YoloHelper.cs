using System.Collections.Generic;
using System.Linq;

namespace WinMLBridge
{
    public sealed class YoloHelper
    {
        private YoloOutputParser parser;

        public YoloHelper()
        {
            parser = new YoloOutputParser();
        }

        public IList<YoloBoundingBox> Parse(IList<float> grid) 
        {
            // process output
            var boxes = parser.ParseOutputs(grid.ToArray(), .3F);

            if (boxes.Count > 0)
            {
                // Remove overalapping and low confidence bounding boxes
                boxes = parser.NonMaxSuppress(boxes, 5, .5F);
            }

            return boxes;
        }
    }
}
