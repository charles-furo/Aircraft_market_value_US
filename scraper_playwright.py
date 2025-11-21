"""
Playwright-based web scraper for Trade-A-Plane
Uses real browser automation for better anti-detection
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import time
import re
import random
from typing import List, Dict, Optional
import json


class TradeAPlaneScraperPlaywright:
    """Playwright-based scraper for Trade-A-Plane aircraft listings"""

    BASE_URL = "https://www.trade-a-plane.com"

    def __init__(self, headless: bool = True):
        """
        Initialize the Playwright scraper

        Args:
            headless: Run browser in headless mode (default True)
        """
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def __enter__(self):
        """Context manager entry"""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()

    def start(self):
        """Start the browser"""
        print("Starting Playwright browser...")
        self.playwright = sync_playwright().start()

        # Launch browser with realistic settings
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )

        # Create context with realistic user agent and viewport
        self.context = self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            device_scale_factor=1,
            has_touch=False,
            java_script_enabled=True,
        )

        # Add extra headers
        self.context.set_extra_http_headers({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

        self.page = self.context.new_page()

        # Inject scripts to hide automation
        self.page.add_init_script("""
            // Overwrite the `navigator.webdriver` property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Overwrite the `plugins` property
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Overwrite the `languages` property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });

            // Remove Playwright-specific properties
            delete window.playwright;
        """)

        print("Browser started successfully")

    def close(self):
        """Close the browser"""
        if self.page:
            self.page.close()
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("Browser closed")

    def _navigate_with_retry(self, url: str, max_retries: int = 3) -> bool:
        """
        Navigate to URL with retry logic

        Args:
            url: URL to navigate to
            max_retries: Maximum number of retry attempts

        Returns:
            True if successful, False otherwise
        """
        for attempt in range(max_retries):
            try:
                print(f"Navigating to: {url}")

                # Navigate and wait for the page to load
                response = self.page.goto(url, wait_until='domcontentloaded', timeout=30000)

                if response and response.status == 200:
                    # Wait a bit for dynamic content
                    time.sleep(random.uniform(2, 4))

                    # Wait for body to be present
                    self.page.wait_for_selector('body', timeout=10000)

                    return True
                else:
                    status = response.status if response else 'unknown'
                    print(f"Navigation failed with status {status}. Attempt {attempt + 1}/{max_retries}")

            except PlaywrightTimeoutError:
                print(f"Timeout loading page. Attempt {attempt + 1}/{max_retries}")
            except Exception as e:
                print(f"Navigation error: {e}. Attempt {attempt + 1}/{max_retries}")

            if attempt < max_retries - 1:
                wait_time = random.uniform(3, 6) * (attempt + 1)
                print(f"Waiting {wait_time:.1f}s before retry...")
                time.sleep(wait_time)

        return False

    def search_cessna_172n(self, max_pages: int = 5) -> List[Dict]:
        """
        Search for Cessna 172N aircraft listings

        Args:
            max_pages: Maximum number of pages to scrape

        Returns:
            List of aircraft listing dictionaries
        """
        if not self.page:
            self.start()

        print("=" * 60)
        print("Starting Cessna 172N search with Playwright")
        print("=" * 60)

        # First visit homepage to establish session
        print("\nEstablishing session...")
        if not self._navigate_with_retry(self.BASE_URL):
            print("Failed to establish session with Trade-A-Plane")
            return []

        time.sleep(random.uniform(2, 4))

        all_listings = []

        for page_num in range(1, max_pages + 1):
            print(f"\n{'='*60}")
            print(f"Scraping page {page_num}/{max_pages}")
            print('='*60)

            # Build search URL
            if page_num == 1:
                url = f"{self.BASE_URL}/search?category_level1=Single+Engine+Piston&make=CESSNA&model=172N+SKYHAWK&s-type=aircraft"
            else:
                url = f"{self.BASE_URL}/search?category_level1=Single+Engine+Piston&make=CESSNA&model=172N+SKYHAWK&s-type=aircraft&page={page_num}"

            if not self._navigate_with_retry(url):
                print(f"Failed to load page {page_num}")
                break

            # Wait for listings to load
            try:
                # Wait for common listing elements
                self.page.wait_for_selector('body', timeout=10000)
                time.sleep(random.uniform(1, 2))

                # Get page content
                html = self.page.content()

                # Save debug HTML for first page
                if page_num == 1:
                    print(f"Page loaded. Content length: {len(html)} bytes")
                    with open('/tmp/playwright_debug.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    print("Saved debug HTML to /tmp/playwright_debug.html")

                # Parse listings from the page
                listings = self._parse_page_listings()

                if not listings:
                    print(f"No listings found on page {page_num}")
                    if page_num == 1:
                        print("This might mean the page structure has changed or we're being blocked")
                        # Take a screenshot for debugging
                        screenshot_path = '/tmp/playwright_screenshot.png'
                        self.page.screenshot(path=screenshot_path)
                        print(f"Saved screenshot to {screenshot_path}")
                    break

                print(f"Found {len(listings)} listings on page {page_num}")
                all_listings.extend(listings)

                # Respectful delay between pages
                if page_num < max_pages:
                    delay = random.uniform(3, 5)
                    print(f"Waiting {delay:.1f}s before next page...")
                    time.sleep(delay)

            except Exception as e:
                print(f"Error processing page {page_num}: {e}")
                break

        print(f"\n{'='*60}")
        print(f"TOTAL: Found {len(all_listings)} listings across all pages")
        print('='*60)

        return all_listings

    def _parse_page_listings(self) -> List[Dict]:
        """
        Parse listings from the current page using Playwright selectors

        Returns:
            List of listing dictionaries
        """
        listings = []

        try:
            # Try multiple strategies to find listings

            # Strategy 1: Look for listing cards/containers
            listing_selectors = [
                'div[class*="listing"]',
                'div[class*="result"]',
                'div[class*="aircraft"]',
                'div[class*="item"]',
                'article',
                '.listing-card',
                '.result-item',
            ]

            listing_elements = []
            for selector in listing_selectors:
                elements = self.page.query_selector_all(selector)
                if elements and len(elements) > 0:
                    print(f"Found {len(elements)} elements with selector: {selector}")
                    listing_elements = elements
                    break

            if not listing_elements:
                print("No listing elements found with standard selectors")
                # Try to find price elements and work from there
                price_elements = self.page.query_selector_all('text=/\\$[\\d,]+/')
                if price_elements:
                    print(f"Found {len(price_elements)} price elements")
                    # Get parent containers
                    for elem in price_elements[:20]:  # Limit to avoid too many
                        try:
                            parent = elem.evaluate('el => el.closest("div[class], article, li")')
                            if parent:
                                listing_elements.append(elem)
                        except:
                            continue

            # Parse each listing element
            for elem in listing_elements:
                try:
                    listing = self._parse_listing_element(elem)
                    if listing and (listing.get('price') or listing.get('url')):
                        listings.append(listing)
                except Exception as e:
                    print(f"Error parsing listing element: {e}")
                    continue

            # If still no listings, try a more aggressive approach
            if not listings:
                print("Attempting aggressive text parsing...")
                page_text = self.page.inner_text('body')
                listings = self._parse_from_text(page_text)

        except Exception as e:
            print(f"Error in _parse_page_listings: {e}")

        return listings

    def _parse_listing_element(self, element) -> Optional[Dict]:
        """
        Parse individual listing element using Playwright

        Args:
            element: Playwright element handle

        Returns:
            Dictionary with listing data or None
        """
        listing = {
            'price': None,
            'location': None,
            'url': None,
            'year': None,
            'registration': None,
            'serial_number': None,
            'hours': None,
            'description': None,
        }

        try:
            # Get all text content
            text_content = element.inner_text() if hasattr(element, 'inner_text') else element.evaluate('el => el.innerText')

            # Extract price
            price_match = re.search(r'\$([\\d,]+)', text_content)
            if price_match:
                listing['price'] = price_match.group(1).replace(',', '')

            # Extract year (4 digits, likely 1950-2030)
            year_match = re.search(r'\b(19[5-9]\d|20[0-3]\d)\b', text_content)
            if year_match:
                listing['year'] = year_match.group(1)

            # Extract location (City, ST format)
            location_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b', text_content)
            if location_match:
                listing['location'] = f"{location_match.group(1)}, {location_match.group(2)}"

            # Extract hours (TTAF, TT, hours)
            hours_match = re.search(r'(\d+(?:,\d+)?)\s*(?:hrs?|hours?|TT|TTAF)', text_content, re.IGNORECASE)
            if hours_match:
                listing['hours'] = hours_match.group(1).replace(',', '')

            # Try to find URL
            try:
                link = element.query_selector('a[href*="/listing/"], a[href*="/aircraft/"]')
                if link:
                    href = link.get_attribute('href')
                    if href:
                        if href.startswith('/'):
                            listing['url'] = f"{self.BASE_URL}{href}"
                        elif href.startswith('http'):
                            listing['url'] = href
            except:
                pass

            # Store raw description
            listing['description'] = text_content[:200] if text_content else None

        except Exception as e:
            print(f"Error parsing element: {e}")
            return None

        return listing

    def _parse_from_text(self, text: str) -> List[Dict]:
        """
        Parse listings from raw page text as fallback

        Args:
            text: Raw page text

        Returns:
            List of listing dictionaries
        """
        listings = []

        # Find all prices
        price_pattern = r'\$([\\d,]+)'
        prices = re.finditer(price_pattern, text)

        for match in prices:
            # Get context around the price (500 chars before and after)
            start = max(0, match.start() - 500)
            end = min(len(text), match.end() + 500)
            context = text[start:end]

            listing = {
                'price': match.group(1).replace(',', ''),
                'location': None,
                'url': None,
                'year': None,
            }

            # Try to extract other info from context
            location_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b', context)
            if location_match:
                listing['location'] = f"{location_match.group(1)}, {location_match.group(2)}"

            year_match = re.search(r'\b(19[5-9]\d|20[0-3]\d)\b', context)
            if year_match:
                listing['year'] = year_match.group(1)

            # Only add if we have reasonable data
            if listing['price']:
                listings.append(listing)

        return listings[:50]  # Limit to 50 to avoid duplicates

    def calculate_average_price(self, listings: List[Dict]) -> Optional[float]:
        """Calculate average asking price from listings"""
        prices = [float(listing['price']) for listing in listings if listing.get('price')]

        if not prices:
            return None

        return sum(prices) / len(prices)


def main():
    """Test the Playwright scraper"""
    print("=" * 60)
    print("Testing Playwright Trade-A-Plane Scraper")
    print("=" * 60)

    with TradeAPlaneScraperPlaywright(headless=True) as scraper:
        listings = scraper.search_cessna_172n(max_pages=2)

        print(f"\n{'='*60}")
        print(f"RESULTS: Found {len(listings)} listings")
        print('='*60)

        if listings:
            avg_price = scraper.calculate_average_price(listings)
            if avg_price:
                print(f"\nAverage price: ${avg_price:,.2f}")

            print(f"\nFirst {min(5, len(listings))} listings:")
            for i, listing in enumerate(listings[:5], 1):
                print(f"\n{i}. Price: ${float(listing['price']):,.2f}")
                print(f"   Year: {listing.get('year', 'N/A')}")
                print(f"   Location: {listing.get('location', 'N/A')}")
                print(f"   Hours: {listing.get('hours', 'N/A')}")
                print(f"   URL: {listing.get('url', 'N/A')}")
        else:
            print("\nNo listings found.")
            print("Check /tmp/playwright_debug.html and /tmp/playwright_screenshot.png for debugging")


if __name__ == '__main__':
    main()
