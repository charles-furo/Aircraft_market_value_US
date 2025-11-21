"""
Web scraper for Trade-A-Plane aircraft listings
Extracts Cessna 172N listing data including price, location, hours, and avionics
"""

import requests
from bs4 import BeautifulSoup
import time
import re
from typing import List, Dict, Optional


class TradeAPlaneScraper:
    """Scraper for Trade-A-Plane aircraft listings"""

    BASE_URL = "https://www.trade-a-plane.com"

    def __init__(self):
        self.session = requests.Session()
        # Set headers to mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        })

    def search_cessna_172n(self, max_pages: int = 5) -> List[Dict]:
        """
        Search for Cessna 172N aircraft listings

        Args:
            max_pages: Maximum number of pages to scrape

        Returns:
            List of aircraft listing dictionaries
        """
        all_listings = []

        for page in range(1, max_pages + 1):
            print(f"Scraping page {page}...")

            # Build URL with pagination
            if page == 1:
                url = f"{self.BASE_URL}/search?make=CESSNA&model=172N+SKYHAWK&s-type=aircraft"
            else:
                url = f"{self.BASE_URL}/search?make=CESSNA&model=172N+SKYHAWK&s-type=aircraft&s-page={page}"

            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()

                # Parse the page
                listings = self._parse_search_results(response.text, url)

                if not listings:
                    print(f"No more listings found on page {page}")
                    break

                all_listings.extend(listings)

                # Be respectful - add delay between requests
                time.sleep(2)

            except requests.exceptions.RequestException as e:
                print(f"Error fetching page {page}: {e}")
                break

        return all_listings

    def _parse_search_results(self, html: str, page_url: str) -> List[Dict]:
        """
        Parse search results page and extract listing data

        Args:
            html: HTML content of the search results page
            page_url: URL of the page being parsed

        Returns:
            List of aircraft listing dictionaries
        """
        soup = BeautifulSoup(html, 'lxml')
        listings = []

        # Find all listing containers
        # This will need to be adjusted based on the actual HTML structure
        listing_elements = soup.find_all('div', class_=re.compile(r'listing|result|aircraft', re.I))

        if not listing_elements:
            # Try alternative selectors
            listing_elements = soup.find_all('article') or soup.find_all('li', class_=re.compile(r'result'))

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
        """
        Parse individual listing element

        Args:
            element: BeautifulSoup element containing listing data

        Returns:
            Dictionary with listing data or None if parsing fails
        """
        listing = {
            'price': None,
            'location': None,
            'url': None,
            'engine_hours': None,
            'propeller_hours': None,
            'airframe_hours': None,
            'avionics': []
        }

        # Extract price
        price_elem = element.find(text=re.compile(r'\$[\d,]+'))
        if price_elem:
            price_text = re.search(r'\$([\d,]+)', price_elem.string)
            if price_text:
                listing['price'] = price_text.group(1).replace(',', '')

        # Extract URL
        link_elem = element.find('a', href=True)
        if link_elem:
            href = link_elem['href']
            if href.startswith('/'):
                listing['url'] = f"{self.BASE_URL}{href}"
            else:
                listing['url'] = href

        # Extract location
        location_elem = element.find(text=re.compile(r'[A-Z]{2}$|[A-Z]{2},\s*USA'))
        if location_elem:
            listing['location'] = location_elem.string.strip()

        # Get detailed info from listing page
        if listing['url']:
            detail_data = self._fetch_listing_details(listing['url'])
            listing.update(detail_data)

        # Only return if we have at least price and URL
        if listing['price'] and listing['url']:
            return listing

        return None

    def _fetch_listing_details(self, url: str) -> Dict:
        """
        Fetch detailed information from individual listing page

        Args:
            url: URL of the listing detail page

        Returns:
            Dictionary with detailed listing data
        """
        details = {
            'engine_hours': None,
            'propeller_hours': None,
            'airframe_hours': None,
            'avionics': [],
            'location': None
        }

        try:
            time.sleep(1)  # Be respectful
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'lxml')

            # Extract hours information
            text_content = soup.get_text()

            # Engine hours
            engine_match = re.search(r'engine.*?(\d+(?:,\d+)?)\s*(?:hours?|hrs?|time)', text_content, re.I)
            if engine_match:
                details['engine_hours'] = engine_match.group(1).replace(',', '')

            # Airframe hours
            airframe_match = re.search(r'(?:airframe|total time).*?(\d+(?:,\d+)?)\s*(?:hours?|hrs?)', text_content, re.I)
            if airframe_match:
                details['airframe_hours'] = airframe_match.group(1).replace(',', '')

            # Propeller hours
            prop_match = re.search(r'prop(?:eller)?.*?(\d+(?:,\d+)?)\s*(?:hours?|hrs?)', text_content, re.I)
            if prop_match:
                details['propeller_hours'] = prop_match.group(1).replace(',', '')

            # Extract avionics - look for common avionics brands/models
            avionics_keywords = [
                'Garmin', 'G1000', 'G430', 'G530', 'GTN', 'GNS',
                'Aspen', 'Avidyne', 'KLN', 'King', 'KX',
                'Bendix', 'Collins', 'Honeywell',
                'GPS', 'Autopilot', 'ADS-B', 'WAAS',
                'transponder', 'NAV/COM', 'DME'
            ]

            found_avionics = set()
            for keyword in avionics_keywords:
                if re.search(r'\b' + keyword + r'\b', text_content, re.I):
                    found_avionics.add(keyword)

            details['avionics'] = list(found_avionics)

            # Extract location if not already found
            location_elem = soup.find(text=re.compile(r'Location|Located'))
            if location_elem and not details['location']:
                # Look for nearby text that might contain location
                parent = location_elem.parent
                if parent:
                    location_text = parent.get_text()
                    location_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})', location_text)
                    if location_match:
                        details['location'] = location_match.group(1)

        except Exception as e:
            print(f"Error fetching details from {url}: {e}")

        return details

    def calculate_average_price(self, listings: List[Dict]) -> Optional[float]:
        """
        Calculate average asking price from listings

        Args:
            listings: List of aircraft listing dictionaries

        Returns:
            Average price or None if no valid prices
        """
        prices = [float(listing['price']) for listing in listings if listing.get('price')]

        if not prices:
            return None

        return sum(prices) / len(prices)


def main():
    """Test the scraper"""
    scraper = TradeAPlaneScraper()

    print("Starting to scrape Cessna 172N listings...")
    listings = scraper.search_cessna_172n(max_pages=3)

    print(f"\nFound {len(listings)} listings")

    if listings:
        avg_price = scraper.calculate_average_price(listings)
        print(f"Average price: ${avg_price:,.2f}")

        print("\nFirst 3 listings:")
        for i, listing in enumerate(listings[:3], 1):
            print(f"\n{i}. Price: ${float(listing['price']):,.2f}")
            print(f"   Location: {listing.get('location', 'N/A')}")
            print(f"   URL: {listing['url']}")
            print(f"   Airframe Hours: {listing.get('airframe_hours', 'N/A')}")
            print(f"   Engine Hours: {listing.get('engine_hours', 'N/A')}")
            print(f"   Prop Hours: {listing.get('propeller_hours', 'N/A')}")
            print(f"   Avionics: {', '.join(listing.get('avionics', [])) or 'N/A'}")


if __name__ == '__main__':
    main()
