using CareTogether.Utilities.FileStore;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class FileReadOptionsTests
    {
        [DataTestMethod]
        [DataRow("intake.pdf", "application/pdf")]
        [DataRow("SCAN.PDF", "application/pdf")]
        [DataRow("photo.jpeg", "image/jpeg")]
        [DataRow("photo.JPG", "image/jpeg")]
        [DataRow("badge.png", "image/png")]
        [DataRow(
            "form.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )]
        [DataRow("page.html", "application/octet-stream")]
        [DataRow("drawing.svg", "application/octet-stream")]
        [DataRow("no-extension", "application/octet-stream")]
        [DataRow("", "application/octet-stream")]
        public void ContentTypeComesFromTheUploadedFileExtension(
            string fileName,
            string expectedContentType
        )
        {
            Assert.AreEqual(expectedContentType, FileContentTypes.FromFileName(fileName));
        }

        [TestMethod]
        public void InlineDispositionKeepsTheFileName()
        {
            var options = new FileReadOptions("intake form.pdf", FileReadDisposition.Inline);

            Assert.AreEqual("application/pdf", options.ContentType);
            Assert.AreEqual(
                "inline; filename=\"intake form.pdf\"; filename*=UTF-8''intake%20form.pdf",
                options.ContentDisposition
            );
        }

        [TestMethod]
        public void AttachmentDispositionEscapesUnsafeAndNonAsciiCharacters()
        {
            Assert.AreEqual(
                "attachment; filename=\"Jos_ _quote_.pdf\"; filename*=UTF-8''Jos%C3%A9%20%22quote%22.pdf",
                FileContentTypes.ContentDisposition(
                    "José \"quote\".pdf",
                    FileReadDisposition.Attachment
                )
            );
        }

        [TestMethod]
        public void DispositionWithoutAFileNameHasNoFileNameParameter()
        {
            Assert.AreEqual(
                "attachment",
                FileContentTypes.ContentDisposition("  ", FileReadDisposition.Attachment)
            );
        }
    }
}
