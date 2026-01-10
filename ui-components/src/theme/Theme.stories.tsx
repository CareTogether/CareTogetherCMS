import type { Meta, StoryObj } from "@storybook/react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography,
  Stack,
  Divider,
  Paper,
  IconButton,
  Alert,
  Switch,
  Checkbox,
  Radio,
  Slider,
  Badge,
} from "@mui/material";
import {
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { theme } from "./theme";

/**
 *
 * This showcase displays the complete CareTogether MUI theme, including:
 * - Color palette (primary, secondary, error, warning, info, success)
 * - Typography variants (h1-h6, body, button, caption, etc.)
 * - Component styling (buttons, cards, chips, inputs, etc.)
 * - Spacing and shape system
 *
 * Use this as a reference when building components with the CareTogether theme.
 */
const meta = {
  title: "Theme/Theme Showcase",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete theme showcase with all colors, typography, and common components.
 */
export const CompleteShowcase: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
      {/* Header */}
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        CareTogether MUI Theme
      </Typography>

      {/* Color Palette */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Color Palette
        </Typography>

        {/* Primary Colors */}
        <Typography variant="h6" gutterBottom>
          Primary (Teal)
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ColorSwatch
            color={theme.palette.primary.light}
            label="Light"
            textColor={theme.palette.primary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.primary.main}
            label="Main (#26A3AB)"
            textColor={theme.palette.primary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.primary.dark}
            label="Dark (#07666C)"
            textColor={theme.palette.primary.contrastText}
          />
        </Stack>

        {/* Primary Dark - Custom Color */}
        <Typography variant="h6" gutterBottom>
          Primary Dark (Deep Teal) - Available as color=&quot;primaryDark&quot;
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ColorSwatch
            color={theme.palette.primaryDark.light}
            label="Light"
            textColor={theme.palette.primaryDark.contrastText}
          />
          <ColorSwatch
            color={theme.palette.primaryDark.main}
            label="Main (#07666C)"
            textColor={theme.palette.primaryDark.contrastText}
          />
          <ColorSwatch
            color={theme.palette.primaryDark.dark}
            label="Dark"
            textColor={theme.palette.primaryDark.contrastText}
          />
        </Stack>

        {/* Secondary Colors */}
        <Typography variant="h6" gutterBottom>
          Secondary (Red)
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ColorSwatch
            color={theme.palette.secondary.light}
            label="Light"
            textColor={theme.palette.secondary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.secondary.main}
            label="Main (#D32F2F)"
            textColor={theme.palette.secondary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.secondary.dark}
            label="Dark"
            textColor={theme.palette.secondary.contrastText}
          />
        </Stack>

        {/* Tertiary Colors */}
        <Typography variant="h6" gutterBottom>
          Tertiary (Medium Teal) - Available as color=&quot;tertiary&quot;
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ColorSwatch
            color={theme.palette.tertiary.light}
            label="Light"
            textColor={theme.palette.tertiary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.tertiary.main}
            label="Main (#00616F)"
            textColor={theme.palette.tertiary.contrastText}
          />
          <ColorSwatch
            color={theme.palette.tertiary.dark}
            label="Dark"
            textColor={theme.palette.tertiary.contrastText}
          />
        </Stack>

        {/* Status Colors */}
        <Typography variant="h6" gutterBottom>
          Status Colors
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ColorSwatch color={theme.palette.error.main} label="Error" textColor="#fff" />
          <ColorSwatch
            color={theme.palette.warning.main}
            label="Warning (#EF6C00)"
            textColor="#fff"
          />
          <ColorSwatch color={theme.palette.info.main} label="Info" textColor="#fff" />
          <ColorSwatch color={theme.palette.success.main} label="Success" textColor="#fff" />
        </Stack>

        {/* Background Colors */}
        <Typography variant="h6" gutterBottom>
          Background
        </Typography>
        <Stack direction="row" spacing={2}>
          <ColorSwatch
            color={theme.palette.background.default}
            label="Default (#F6FCFC)"
            textColor="#000"
            border
          />
          <ColorSwatch
            color={theme.palette.background.paper}
            label="Paper"
            textColor="#000"
            border
          />
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Typography */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Typography
        </Typography>
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Font Family: Inter | Border Radius: 8px
        </Typography>

        <Stack spacing={2}>
          <TypographyExample variant="h1" text="Heading 1" />
          <TypographyExample variant="h2" text="Heading 2" />
          <TypographyExample variant="h3" text="Heading 3" />
          <TypographyExample variant="h4" text="Heading 4" />
          <TypographyExample variant="h5" text="Heading 5" />
          <TypographyExample variant="h6" text="Heading 6" />
          <TypographyExample
            variant="body1"
            text="Body 1: The quick brown fox jumps over the lazy dog. This is the default body text style."
          />
          <TypographyExample
            variant="body2"
            text="Body 2: The quick brown fox jumps over the lazy dog. This is a slightly smaller body text."
          />
          <TypographyExample variant="button" text="Button Text" />
          <TypographyExample variant="caption" text="Caption: Small supporting text or labels" />
          <TypographyExample variant="overline" text="Overline Text" />
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Buttons */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Buttons
        </Typography>
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Border Radius: 24px • Text Transform: none • 500 weight
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Contained Buttons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="contained" color="primary">
                Primary
              </Button>
              <Button variant="contained" color="primaryDark">
                Primary Dark
              </Button>
              <Button variant="contained" color="secondary">
                Secondary
              </Button>
              <Button variant="contained" color="error">
                Error
              </Button>
              <Button variant="contained" color="warning">
                Warning
              </Button>
              <Button variant="contained" color="info">
                Info
              </Button>
              <Button variant="contained" color="success">
                Success
              </Button>
              <Button variant="contained" disabled>
                Disabled
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Outlined Buttons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="outlined" color="primary">
                Primary
              </Button>
              <Button variant="outlined" color="primaryDark">
                Primary Dark
              </Button>
              <Button variant="outlined" color="secondary">
                Secondary
              </Button>
              <Button variant="outlined" color="error">
                Error
              </Button>
              <Button variant="outlined" disabled>
                Disabled
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Text Buttons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="text" color="primary">
                Primary
              </Button>
              <Button variant="text" color="primaryDark">
                Primary Dark
              </Button>
              <Button variant="text" color="secondary">
                Secondary
              </Button>
              <Button variant="text" color="error">
                Error
              </Button>
              <Button variant="text" disabled>
                Disabled
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Buttons with Icons
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button variant="contained" startIcon={<SendIcon />}>
                Send
              </Button>
              <Button variant="contained" color="secondary" endIcon={<DeleteIcon />}>
                Delete
              </Button>
              <IconButton color="primary">
                <FavoriteIcon />
              </IconButton>
              <IconButton color="secondary">
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Button Sizes
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Button variant="contained" size="small">
                Small
              </Button>
              <Button variant="contained" size="medium">
                Medium
              </Button>
              <Button variant="contained" size="large">
                Large
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Form Inputs */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Form Inputs
        </Typography>

        <Stack spacing={3} sx={{ maxWidth: 600 }}>
          <TextField label="Standard Text Field" variant="outlined" />
          <TextField label="Filled Text Field" variant="filled" />
          <TextField label="Email Address" type="email" placeholder="user@example.com" />
          <TextField label="Multiline" multiline rows={4} placeholder="Enter multiple lines..." />
          <TextField label="Disabled" disabled value="Disabled input" />
          <TextField label="Error State" error helperText="This field is required" />

          <Box>
            <Typography variant="body2" gutterBottom>
              Checkboxes
            </Typography>
            <Stack direction="row" spacing={2}>
              <Checkbox defaultChecked />
              <Checkbox />
              <Checkbox disabled />
              <Checkbox disabled checked />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Radio Buttons
            </Typography>
            <Stack direction="row" spacing={2}>
              <Radio checked />
              <Radio />
              <Radio disabled />
              <Radio disabled checked />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Switches
            </Typography>
            <Stack direction="row" spacing={2}>
              <Switch defaultChecked />
              <Switch />
              <Switch disabled />
              <Switch disabled checked />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Slider
            </Typography>
            <Slider defaultValue={30} />
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Chips */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Chips
        </Typography>
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Border Radius: 8px
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" gutterBottom>
              Filled Chips
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="Primary" color="primary" />
              <Chip label="Primary Dark" color="primaryDark" />
              <Chip label="Secondary" color="secondary" />
              <Chip label="Success" color="success" />
              <Chip label="Error" color="error" />
              <Chip label="Warning" color="warning" />
              <Chip label="Info" color="info" />
              <Chip label="Default" />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Outlined Chips
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="Primary" color="primary" variant="outlined" />
              <Chip label="Primary Dark" color="primaryDark" variant="outlined" />
              <Chip label="Secondary" color="secondary" variant="outlined" />
              <Chip label="Default" variant="outlined" />
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Chips with Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="Deletable" color="primary" onDelete={() => {}} />
              <Chip label="Clickable" color="primary" onClick={() => {}} />
              <Chip label="With Icon" color="primary" icon={<FavoriteIcon />} />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Cards */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Cards & Paper
        </Typography>
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Border Radius: 8px
        </Typography>

        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Card Title
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cards are surfaces that display content and actions on a single topic. They should
                be easy to scan for relevant and actionable information.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" size="small" sx={{ mr: 1 }}>
                  Action
                </Button>
                <Button variant="outlined" size="small">
                  Learn More
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography variant="body2">Paper with elevation 0</Typography>
          </Paper>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="body2">Paper with elevation 1</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="body2">Paper with elevation 3</Typography>
          </Paper>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Alerts & Badges */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Alerts & Badges
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Alerts
            </Typography>
            <Stack spacing={2}>
              <Alert severity="success">This is a success alert — check it out!</Alert>
              <Alert severity="info">This is an info alert — check it out!</Alert>
              <Alert severity="warning">This is a warning alert — check it out!</Alert>
              <Alert severity="error">This is an error alert — check it out!</Alert>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Badges
            </Typography>
            <Stack direction="row" spacing={4}>
              <Badge badgeContent={4} color="primary">
                <NotificationsIcon />
              </Badge>
              <Badge badgeContent={10} color="secondary">
                <NotificationsIcon />
              </Badge>
              <Badge badgeContent={100} color="error">
                <NotificationsIcon />
              </Badge>
              <Badge variant="dot" color="primary">
                <NotificationsIcon />
              </Badge>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Spacing Reference */}
      <Divider sx={{ my: 4 }} />
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Spacing System
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          MUI uses an 8px spacing unit. Common values:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">• spacing(1) = 8px</Typography>
          <Typography variant="body2">• spacing(2) = 16px</Typography>
          <Typography variant="body2">• spacing(3) = 24px</Typography>
          <Typography variant="body2">• spacing(4) = 32px</Typography>
          <Typography variant="body2">• spacing(6) = 48px</Typography>
          <Typography variant="body2">• spacing(8) = 64px</Typography>
        </Stack>
      </Box>
    </Box>
  ),
};

/**
 * A focused view of just the color palette for quick reference.
 */
export const ColorPaletteOnly: Story = {
  render: () => (
    <Box sx={{ maxWidth: 800, margin: "0 auto", padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        CareTogether Color Palette
      </Typography>

      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Primary (Teal)
          </Typography>
          <Stack direction="row" spacing={2}>
            <ColorSwatch
              color={theme.palette.primary.light}
              label="Light (#338a8f)"
              textColor={theme.palette.primary.contrastText}
            />
            <ColorSwatch
              color={theme.palette.primary.main}
              label="Main (#07666C)"
              textColor={theme.palette.primary.contrastText}
            />
            <ColorSwatch
              color={theme.palette.primary.dark}
              label="Dark (#00616F)"
              textColor={theme.palette.primary.contrastText}
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Secondary (Red)
          </Typography>
          <Stack direction="row" spacing={2}>
            <ColorSwatch
              color={theme.palette.secondary.light}
              label="Light (#ff6659)"
              textColor={theme.palette.secondary.contrastText}
            />
            <ColorSwatch
              color={theme.palette.secondary.main}
              label="Main (#D32F2F)"
              textColor={theme.palette.secondary.contrastText}
            />
            <ColorSwatch
              color={theme.palette.secondary.dark}
              label="Dark (#9a0007)"
              textColor={theme.palette.secondary.contrastText}
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Status Colors
          </Typography>
          <Stack direction="row" spacing={2}>
            <ColorSwatch color={theme.palette.error.main} label="Error" textColor="#fff" />
            <ColorSwatch
              color={theme.palette.warning.main}
              label="Warning (#EF6C00)"
              textColor="#fff"
            />
            <ColorSwatch color={theme.palette.info.main} label="Info" textColor="#fff" />
            <ColorSwatch color={theme.palette.success.main} label="Success" textColor="#fff" />
          </Stack>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Background
          </Typography>
          <Stack direction="row" spacing={2}>
            <ColorSwatch
              color={theme.palette.background.default}
              label="Default (#F6FCFC)"
              textColor="#000"
              border
            />
            <ColorSwatch
              color={theme.palette.background.paper}
              label="Paper (#ffffff)"
              textColor="#000"
              border
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  ),
};

/**
 * A focused view of typography variants for quick reference.
 */
export const TypographyOnly: Story = {
  render: () => (
    <Box sx={{ maxWidth: 800, margin: "0 auto", padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Typography System
      </Typography>
      <Typography
        variant="caption"
        display="block"
        gutterBottom
        sx={{ mb: 4, color: "text.secondary" }}
      >
        Font Family: Inter, Helvetica, Arial, sans-serif
      </Typography>

      <Stack spacing={3}>
        <TypographyExample variant="h1" text="Heading 1" />
        <TypographyExample variant="h2" text="Heading 2" />
        <TypographyExample variant="h3" text="Heading 3" />
        <TypographyExample variant="h4" text="Heading 4" />
        <TypographyExample variant="h5" text="Heading 5" />
        <TypographyExample variant="h6" text="Heading 6" />
        <TypographyExample
          variant="body1"
          text="Body 1 — The quick brown fox jumps over the lazy dog"
        />
        <TypographyExample
          variant="body2"
          text="Body 2 — The quick brown fox jumps over the lazy dog"
        />
        <TypographyExample variant="button" text="Button Text" />
        <TypographyExample variant="caption" text="Caption — Small supporting text" />
        <TypographyExample variant="overline" text="Overline Text" />
      </Stack>
    </Box>
  ),
};

// Helper Components

interface ColorSwatchProps {
  color: string;
  label: string;
  textColor?: string;
  border?: boolean;
}

function ColorSwatch({ color, label, textColor = "#fff", border }: ColorSwatchProps) {
  return (
    <Box
      sx={{
        width: 160,
        height: 100,
        backgroundColor: color,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        border: border ? "1px solid #ccc" : "none",
      }}
    >
      <Typography variant="body2" sx={{ color: textColor, fontWeight: 500, textAlign: "center" }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: textColor, opacity: 0.8, textAlign: "center" }}>
        {color}
      </Typography>
    </Box>
  );
}

interface TypographyExampleProps {
  variant:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body1"
    | "body2"
    | "button"
    | "caption"
    | "overline";
  text: string;
}

function TypographyExample({ variant, text }: TypographyExampleProps) {
  const variantStyle = theme.typography[variant];
  const fontSize =
    typeof variantStyle.fontSize === "string"
      ? variantStyle.fontSize
      : `${variantStyle.fontSize}px`;
  const fontWeight = variantStyle.fontWeight;
  const letterSpacing = variantStyle.letterSpacing || "0";

  return (
    <Box>
      <Typography variant={variant}>{text}</Typography>
      <Typography variant="caption" color="text.secondary">
        {fontSize} • {fontWeight} weight • {letterSpacing} spacing
      </Typography>
    </Box>
  );
}
