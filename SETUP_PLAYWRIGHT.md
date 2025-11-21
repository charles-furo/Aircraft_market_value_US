# Playwright Setup Guide

This document explains how to set up and use the Playwright-based scraper for the Aircraft Market Value Tracker.

## Prerequisites

- Python 3.11+
- pip package manager

## Installation Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

After installing the Python packages, you need to install the browser binaries:

```bash
python -m playwright install chromium
```

Or install with system dependencies:

```bash
python -m playwright install chromium --with-deps
```

### 3. Verify Installation

Test the Playwright scraper:

```bash
python scraper_playwright.py
```

## Usage

### Command Line

Run the scraper directly:

```bash
python scraper_playwright.py
```

### Web Application

Start the Flask app:

```bash
python app.py
```

Then access the web interface at `http://localhost:8080`

## Features

The Playwright implementation provides several advantages over the previous requests-based scraper:

1. **Real Browser Automation**: Uses an actual Chromium browser to render JavaScript
2. **Better Anti-Detection**: Includes anti-bot detection measures:
   - Removes `navigator.webdriver` property
   - Realistic browser fingerprint
   - Human-like delays between requests
   - Proper headers and viewport settings

3. **Robust Parsing**: Can handle dynamic content loaded via JavaScript

4. **Debug Capabilities**:
   - Saves HTML to `/tmp/playwright_debug.html`
   - Captures screenshots to `/tmp/playwright_screenshot.png`
   - Detailed console logging

## Troubleshooting

### Browser Download Fails

If you encounter 403 errors when downloading browsers, try:

1. Check your internet connection
2. Try a different network (corporate firewalls may block downloads)
3. Manually download from [Playwright builds](https://playwright.azureedge.net/)

### No Listings Found

If the scraper returns no listings:

1. Check `/tmp/playwright_debug.html` to see the actual page content
2. Check `/tmp/playwright_screenshot.png` to see what the browser rendered
3. The website may have changed its HTML structure
4. The website may be blocking automated access

### Performance

The Playwright scraper is slower than requests-based scrapers because it:
- Launches a real browser
- Waits for JavaScript to execute
- Includes delays to avoid detection

Typical scraping time: 30-60 seconds for 5 pages

## Configuration

You can modify scraper behavior in `scraper_playwright.py`:

- `headless=False`: Show the browser window (useful for debugging)
- `max_pages`: Control how many pages to scrape
- Delay timings: Adjust `time.sleep()` values for faster/slower scraping

## API Changes

The Playwright scraper maintains the same API as the previous scraper:

```python
from scraper_playwright import TradeAPlaneScraperPlaywright

# Use with context manager (recommended)
with TradeAPlaneScraperPlaywright(headless=True) as scraper:
    listings = scraper.search_cessna_172n(max_pages=5)
    avg_price = scraper.calculate_average_price(listings)
```

## Migration Notes

If you were using the old `scraper.py` or `scraper_enhanced.py`:

1. Update imports from `scraper` to `scraper_playwright`
2. Use context manager (`with` statement) for proper cleanup
3. Expect slightly different data structure (more fields available)

The Flask app (`app.py`) has been updated to use the Playwright scraper automatically.
