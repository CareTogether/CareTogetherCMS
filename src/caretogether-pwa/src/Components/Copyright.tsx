import { Typography } from "@mui/material";

export function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center" sx={{lineHeight: '3em'}}>
      {' © '} {new Date().getFullYear()} &nbsp;
      <a color="inherit" href="https://caretogether.io/" target="_blank" rel="noreferrer">
        CareTogether CMS
      </a><br />
    </Typography>
  );
}
