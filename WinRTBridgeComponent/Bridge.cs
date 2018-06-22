using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WinRTBridgeComponent
{
    public sealed class Bridge
    {
        public string GetAnswer()
        {
            return "instance";
        }

        public static string GetAnswerStatic()
        {
            return "static";
        }
    }
}
