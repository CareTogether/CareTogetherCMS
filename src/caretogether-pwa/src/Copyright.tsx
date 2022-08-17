import { Typography } from "@mui/material";

export function Copyright() {
  return (
    <Typography variant="body2" color="#fff" align="center" sx={{lineHeight: '2em'}}>
      {' © '} {new Date().getFullYear()} &nbsp;
      <a color='#fff' href="https://caretogether.io/" target="_blank" rel="noreferrer">
        CareTogether CMS
      </a><br />
    </Typography>
  );
}
