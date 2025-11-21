"""
Flask web application for Aircraft Market Value Tracker
Serves web interface and provides API for scraping aircraft listings
"""

from flask import Flask, render_template, jsonify
from scraper_playwright import TradeAPlaneScraperPlaywright
import statistics

app = Flask(__name__)


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/api/scrape', methods=['POST'])
def scrape():
    """
    API endpoint to scrape aircraft listings

    Returns:
        JSON response with listings and statistics
    """
    try:
        # Initialize Playwright scraper with context manager
        with TradeAPlaneScraperPlaywright(headless=True) as scraper:
            # Scrape listings (max 5 pages)
            listings = scraper.search_cessna_172n(max_pages=5)

            if not listings:
                return jsonify({
                    'error': 'No listings found',
                    'listings': [],
                    'stats': {
                        'count': 0,
                        'average_price': None,
                        'min_price': None,
                        'max_price': None,
                        'median_price': None
                    }
                }), 404

            # Calculate statistics
            prices = [float(listing['price']) for listing in listings if listing.get('price')]

            stats = {
                'count': len(listings),
                'average_price': None,
                'min_price': None,
                'max_price': None,
                'median_price': None
            }

            if prices:
                stats['average_price'] = sum(prices) / len(prices)
                stats['min_price'] = min(prices)
                stats['max_price'] = max(prices)
                stats['median_price'] = statistics.median(prices)

            return jsonify({
                'success': True,
                'listings': listings,
                'stats': stats
            })

    except Exception as e:
        app.logger.error(f"Error during scraping: {str(e)}")
        return jsonify({
            'error': f'Scraping failed: {str(e)}'
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
