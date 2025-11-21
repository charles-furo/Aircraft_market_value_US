"""
Enhanced web scraper for Trade-A-Plane with better anti-detection
Uses requests with advanced headers and session management
"""

import requests
from bs4 import BeautifulSoup
import time
import re
import random
from typing import List, Dict, Optional


class TradeAPlaneScraper:
    """Enhanced scraper for Trade-A-Plane aircraft listings"""

    BASE_URL = "https://www.trade-a-plane.com"

    def __init__(self):
        self.session = requests.Session()

        # Rotate through different user agents
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        ]

        # Set comprehensive headers
        self._update_headers()

    def _update_headers(self):
        """Update session headers with random user agent"""
        self.session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        })

    def _get_with_retry(self, url: str, max_retries: int = 3) -> Optional[requests.Response]:
        """Fetch URL with retry logic and backoff"""
        for attempt in range(max_retries):
            try:
                # Add referrer after first request
                if attempt > 0:
                    self.session.headers['Referer'] = self.BASE_URL

                # Random delay to appear more human-like
                time.sleep(random.uniform(2, 4))

                # Update user agent on each retry
                self._update_headers()

                response = self.session.get(url, timeout=15, allow_redirects=True)

                if response.status_code == 200:
                    return response
                elif response.status_code == 403:
                    print(f"Access denied (403). Attempt {attempt + 1}/{max_retries}")
                    if attempt < max_retries - 1:
                        time.sleep(random.uniform(5, 10))  # Longer delay on 403
                else:
                    print(f"HTTP {response.status_code}. Attempt {attempt + 1}/{max_retries}")

            except requests.exceptions.RequestException as e:
                print(f"Request error: {e}. Attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(random.uniform(3, 6))

        return None

    def search_cessna_172n(self, max_pages: int = 5) -> List[Dict]:
        """
        Search for Cessna 172N aircraft listings

        Args:
            max_pages: Maximum number of pages to scrape

        Returns:
            List of aircraft listing dictionaries
        """
        print("Initializing scraper... This may take a moment.")

        # First, visit the homepage to establish session
        print("Establishing session...")
        homepage = self._get_with_retry(self.BASE_URL)
        if not homepage:
            print("Failed to establish session with Trade-A-Plane")
            return []

        time.sleep(random.uniform(2, 4))

        all_listings = []

        for page in range(1, max_pages + 1):
            print(f"\nAttempting to scrape page {page}...")

            # Build URL with proper parameters
            if page == 1:
                url = f"{self.BASE_URL}/search?category_level1=Single+Engine+Piston&make=CESSNA&model=172N+SKYHAWK&s-type=aircraft"
            else:
                url = f"{self.BASE_URL}/search?category_level1=Single+Engine+Piston&make=CESSNA&model=172N+SKYHAWK&s-type=aircraft&s-page={page}"

            response = self._get_with_retry(url)

            if not response:
                print(f"Failed to fetch page {page} after multiple attempts")
                break

            # Save HTML for debugging
            if page == 1:
                print(f"Successfully retrieved page. Content length: {len(response.text)} bytes")
                # Check if we got blocked or if it's real content
                if len(response.text) < 10000:
                    print("Warning: Page content seems too small, might be blocked")
                    # Save for debugging
                    with open('/tmp/trade_a_plane_debug.html', 'w') as f:
                        f.write(response.text)
                    print("Saved page content to /tmp/trade_a_plane_debug.html for debugging")

            # Parse the page
            listings = self._parse_search_results(response.text, url)

            if not listings:
                print(f"No listings found on page {page}")
                if page == 1:
                    print("This might indicate that the scraper needs adjustment or the site is blocking us")
                break

            print(f"Found {len(listings)} listings on page {page}")
            all_listings.extend(listings)

            # Be respectful - add delay between requests
            time.sleep(random.uniform(3, 5))

        return all_listings

    def _parse_search_results(self, html: str, page_url: str) -> List[Dict]:
        """
        Parse search results page and extract listing data
        """
        soup = BeautifulSoup(html, 'lxml')
        listings = []

        # Try multiple selector strategies
        # Strategy 1: Look for common listing containers
        listing_elements = soup.find_all('div', class_=re.compile(r'listing|result|item|card', re.I))

        if not listing_elements:
            # Strategy 2: Look for links to aircraft pages
            listing_elements = soup.find_all('a', href=re.compile(r'/listing/|/aircraft/', re.I))

        if not listing_elements:
            # Strategy 3: Look for price elements and work backwards
            price_elements = soup.find_all(text=re.compile(r'\$[\d,]+'))
            listing_elements = [elem.parent.parent for elem in price_elements if elem.parent and elem.parent.parent]

        print(f"Found {len(listing_elements)} potential listing elements using selectors")

        for element in listing_elements:
            try:
                listing = self._parse_listing_element(element)
                if listing:
                    listings.append(listing)
            except Exception as e:
                print(f"Error parsing listing: {e}")
                continue

        return listings

    def _parse_listing_element(self, element) -> Optional[Dict]:
        """Parse individual listing element"""
        listing = {
            'price': None,
            'location': None,
            'url': None,
            'year': None,
            'registration': None,
            'serial_number': None,
            'engine_hours': None,
            'propeller_hours': None,
            'airframe_hours': None,
            'avionics': []
        }

        # Extract price
        price_elem = element.find(text=re.compile(r'\$[\d,]+'))
        if price_elem:
            price_match = re.search(r'\$([\d,]+)', str(price_elem))
            if price_match:
                listing['price'] = price_match.group(1).replace(',', '')

        # Extract URL
        link_elem = element.find('a', href=True)
        if link_elem:
            href = link_elem['href']
            if href.startswith('/'):
                listing['url'] = f"{self.BASE_URL}{href}"
            elif href.startswith('http'):
                listing['url'] = href

        # Extract location
        location_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b', element.get_text())
        if location_match:
            listing['location'] = location_match.group(1)

        # Only return if we have at least a price or URL
        if listing['price'] or listing['url']:
            return listing

        return None

    def calculate_average_price(self, listings: List[Dict]) -> Optional[float]:
        """Calculate average asking price from listings"""
        prices = [float(listing['price']) for listing in listings if listing.get('price')]

        if not prices:
            return None

        return sum(prices) / len(prices)


def main():
    """Test the enhanced scraper"""
    scraper = TradeAPlaneScraper()

    print("=" * 60)
    print("Testing Enhanced Trade-A-Plane Scraper")
    print("=" * 60)

    listings = scraper.search_cessna_172n(max_pages=1)

    print(f"\n{'=' * 60}")
    print(f"RESULTS: Found {len(listings)} listings")
    print('=' * 60)

    if listings:
        avg_price = scraper.calculate_average_price(listings)
        if avg_price:
            print(f"\nAverage price: ${avg_price:,.2f}")

        print(f"\nFirst {min(3, len(listings))} listings:")
        for i, listing in enumerate(listings[:3], 1):
            print(f"\n{i}. Price: ${float(listing['price']):,.2f}")
            print(f"   Location: {listing.get('location', 'N/A')}")
            print(f"   URL: {listing.get('url', 'N/A')}")
    else:
        print("\nNo listings found. The site may be blocking our requests.")
        print("Check /tmp/trade_a_plane_debug.html for the actual page content.")


if __name__ == '__main__':
    main()
