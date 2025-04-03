export function OpenTicketForm() {
  return (
    <>
      <script
        type="text/javascript"
        src="https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.js"
      ></script>
      <style type="text/css" media="screen, projection">
        @import
        url(https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.css);
      </style>
      <iframe
        title="Feedback Form"
        className="freshwidget-embedded-form"
        id="freshwidget-embedded-form"
        src="https://caretogether.freshdesk.com/widgets/feedback_widget/new?&widgetType=embedded&searchArea=no"
        scrolling="no"
        height="800px"
        width="100%"
        frameBorder="0"
      ></iframe>
    </>
  );
}
