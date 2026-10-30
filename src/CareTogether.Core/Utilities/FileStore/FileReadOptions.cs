using System;
using System.Collections.Immutable;
using System.IO;
using System.Linq;

namespace CareTogether.Utilities.FileStore
{
    public enum FileReadDisposition
    {
        Attachment,
        Inline,
    }

    /// <summary>
    /// Response headers that a read valet URL asks the storage service to send, so browsers
    /// can render a file inline (e.g., a PDF or image preview) or save it under its original name.
    /// Blobs are stored under GUID names as application/octet-stream, so these are always overridden.
    /// </summary>
    public sealed record FileReadOptions(string FileName, FileReadDisposition Disposition)
    {
        public string ContentType => FileContentTypes.FromFileName(FileName);

        public string ContentDisposition =>
            FileContentTypes.ContentDisposition(FileName, Disposition);
    }

    public static class FileContentTypes
    {
        public const string Fallback = "application/octet-stream";

        // Deliberately excludes types a browser would execute or render as an active document
        // (e.g., .html, .svg, .xml), so an inline preview can never run script from an uploaded file.
        private static readonly ImmutableDictionary<string, string> contentTypesByExtension = new (
            string Extension,
            string ContentType
        )[]
        {
            (".pdf", "application/pdf"),
            (".png", "image/png"),
            (".jpg", "image/jpeg"),
            (".jpeg", "image/jpeg"),
            (".gif", "image/gif"),
            (".webp", "image/webp"),
            (".bmp", "image/bmp"),
            (".avif", "image/avif"),
            (".heic", "image/heic"),
            (".heif", "image/heif"),
            (".tif", "image/tiff"),
            (".tiff", "image/tiff"),
            (".txt", "text/plain"),
            (".csv", "text/csv"),
            (".rtf", "application/rtf"),
            (".doc", "application/msword"),
            (".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            (".xls", "application/vnd.ms-excel"),
            (".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            (".ppt", "application/vnd.ms-powerpoint"),
            (".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            (".odt", "application/vnd.oasis.opendocument.text"),
            (".ods", "application/vnd.oasis.opendocument.spreadsheet"),
            (".zip", "application/zip"),
        }.ToImmutableDictionary(
            entry => entry.Extension,
            entry => entry.ContentType,
            StringComparer.OrdinalIgnoreCase
        );

        public static string FromFileName(string? fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                return Fallback;

            var extension = Path.GetExtension(fileName.Trim());

            return contentTypesByExtension.TryGetValue(extension, out var contentType)
                ? contentType
                : Fallback;
        }

        public static string ContentDisposition(string? fileName, FileReadDisposition disposition)
        {
            var type = disposition == FileReadDisposition.Inline ? "inline" : "attachment";

            if (string.IsNullOrWhiteSpace(fileName))
                return type;

            var name = fileName.Trim();

            return $"{type}; filename=\"{AsciiFallbackFileName(name)}\"; filename*=UTF-8''{Uri.EscapeDataString(name)}";
        }

        private static string AsciiFallbackFileName(string fileName) =>
            new string(
                fileName
                    .Select(c => c < 0x20 || c > 0x7e || c == '"' || c == '\\' ? '_' : c)
                    .ToArray()
            );
    }
}
