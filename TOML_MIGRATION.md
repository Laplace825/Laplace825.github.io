# TOML Configuration Migration Guide

This document explains the migration from hardcoded configuration in `config.ts` to TOML-based configuration in `config.toml`.

## Overview

The configuration has been migrated to use TOML format, which provides better readability and maintainability. All optional fields from the TypeScript configuration are now properly supported in the TOML file.

## Optional Fields Supported

The following optional fields are now properly handled in the TOML configuration:

### Site Configuration
- `banner.position` - Position of the banner image ("top", "center", "bottom")
- `banner.credit.url` - Optional URL link to the original artwork or artist's page
- `favicon[].theme` - Optional theme for favicons ("light" or "dark")
- `favicon[].sizes` - Optional sizes specification for favicons

### Navigation Bar Configuration
- `links[].external` - Optional flag to show external link icon and open in new tab

### Profile Configuration
- `profile.avatar` - Optional avatar image path
- `profile.bio` - Optional biography text

## Configuration Structure

### Site Section
```toml
[site]
title = "Your Site Title"
subtitle = "Your Site Subtitle"
lang = "en"

[site.themeColor]
hue = 250
fixed = false

[site.banner]
enable = false
src = "assets/images/demo-banner.png"
position = "center"  # Optional

[site.banner.credit]
enable = false
text = ""
url = ""  # Optional

[site.toc]
enable = true
depth = 2

# Multiple favicon entries (all fields except src are optional)
[[site.favicon]]
src = "/favicon/icon.png"
theme = "light"  # Optional
sizes = "32x32"  # Optional
```

### Navigation Bar Section
```toml
[navBar]

# Using LinkPreset (0 = Home, 1 = Archive, 2 = About)
[[navBar.links]]
preset = 0

# Custom link with optional external flag
[[navBar.links]]
name = "GitHub"
url = "https://github.com/example/repo"
external = true  # Optional
```

### Profile Section
```toml
[profile]
avatar = "assets/images/demo-avatar.png"  # Optional
name = "Your Name"
bio = "Your bio text"  # Optional

[[profile.links]]
name = "Twitter"
icon = "fa6-brands:twitter"
url = "https://twitter.com/example"
```

### License Section
```toml
[license]
enable = true
name = "CC BY-NC-SA 4.0"
url = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
```

### Expressive Code Section
```toml
[expressiveCode]
theme = "github-dark"
```

## Migration Benefits

1. **Centralized Configuration**: All configuration is now in one TOML file
2. **Better Readability**: TOML format is more human-readable than TypeScript objects
3. **Type Safety**: TypeScript types are still enforced through the config utilities
4. **Fallback Support**: All fields have sensible defaults if not specified in TOML
5. **Optional Field Support**: All optional fields from TypeScript types are properly handled

## Usage

Simply edit the `src/config.toml` file to customize your site. The `config.ts` file will automatically read from the TOML file and provide fallback defaults for any missing values.

## LinkPreset Values

When configuring navigation bar links, you can use preset values:
- `0` = Home
- `1` = Archive  
- `2` = About

Or define custom links with `name`, `url`, and optional `external` fields.
