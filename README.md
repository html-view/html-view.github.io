# Enhanced HTML Preview

An enhanced version of the HTML Preview project with support for multiple parameters.

## Overview

This project is an enhanced version of the [original HTML Preview project](https://github.com/html-preview/html-preview.github.io) that allows rendering HTML files from git repositories (like GitHub, GitLab, BitBucket, etc.) directly in your browser without cloning or downloading the repository.

The enhanced version adds support for multiple parameters that allow customizing the preview experience.

## Features

- Preview HTML files from various git forges (GitHub, GitLab, BitBucket, etc.)
- Apply custom themes (light/dark)
- Inject custom CSS and JavaScript
- Configure display settings (width, height, scale)
- Control security features (sandbox mode, script removal)
- Manage caching behavior

## Parameters

The following parameters are supported:

### Basic Parameter

- `url` - The URL of the HTML file to preview (required)

### Theme & Styling Parameters

- `theme` - Theme for the preview ("light", "dark", or empty for default)
- `css` - URL of a custom CSS file to apply to the preview

### Content Modification Parameters

- `inject_js` - URL of a JavaScript file to inject into the preview
- `base_path` - Base path for relative URLs in the HTML file
- `remove_scripts` - Boolean parameter to remove all scripts from the preview (true/false)

### Display Parameters

- `width` - Width of the preview iframe in pixels
- `height` - Height of the preview iframe in pixels
- `scale` - Scaling factor for the preview (e.g., 0.5, 1.0, 1.5)

### Caching Parameters

- `cache` - Boolean parameter to enable/disable caching (true/false)
- `cache_time` - Time in seconds to cache the preview

### Security Parameters

- `sandbox` - Boolean parameter to enable/disable sandbox mode (true/false)
- `cors_proxy` - Custom CORS proxy URL

## Usage

### Basic Usage

To preview an HTML file, simply prepend the URL of this service to the URL of the HTML file:

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html
```

### Advanced Usage

You can combine multiple parameters to customize the preview:

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html&theme=dark&width=800&height=600&remove_scripts=true
```

## Examples

### Preview with Dark Theme

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html&theme=dark
```

### Preview with Custom CSS

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html&css=https://example.com/custom.css
```

### Preview with Custom Size

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html&width=800&height=600
```

### Preview with Scripts Removed

```
https://itseyup.github.io/html-preview.github.io/?url=https://github.com/user/repo/blob/master/index.html&remove_scripts=true
```

## Security Considerations

Please be aware of the following security considerations:

- Freely hosted CORS proxies are a potential security risk
- If a script stores sensitive data (as cookie, localStorage, etc.), then other repos you open will also have access to this data
- Don't input sensitive data while previewing
- Clear all site data after previewing a repo

## License

Apache-2.0 License

## Credits

Based on the original [HTML Preview project](https://github.com/html-preview/html-preview.github.io).
Enhanced version by [itseyup](https://github.com/itseyup).
