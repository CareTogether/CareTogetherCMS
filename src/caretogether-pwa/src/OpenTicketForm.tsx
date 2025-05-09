import { Typography } from '@mui/material';

export function OpenTicketForm() {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Submit a ticket (faster turnaround)
      </Typography>
      <Typography variant="body1" paragraph>
        Need help with something specific? Sending us a ticket is usually the
        fastest way to get your issue addressed.
      </Typography>
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
