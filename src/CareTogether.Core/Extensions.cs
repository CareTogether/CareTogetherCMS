using System;
using System.Collections.Generic;

namespace CareTogether
{
    internal static class Extensions
    {
        public static List<T> With<T>(this List<T> list, T valueToAdd)
        {
            list.Add(valueToAdd);
            return list;
        }

        public static List<T> With<T>(this List<T> list, T valueToUpdate, Predicate<T> predicate)
        {
            for (var i = 0; i < list.Count; i++)
                if (predicate(list[i]))
                    list[i] = valueToUpdate;
            return list;
        }
    }
}
