# Aircraft Market Value Tracker

A web application that scrapes aircraft listings from Trade-A-Plane and provides real-time market value analysis for specific aircraft models (currently Cessna 172N).

## Features

- **Real-time Scraping**: Fetches current listings from Trade-A-Plane.com
- **Comprehensive Data**: Extracts price, location, engine hours, propeller hours, airframe hours, and avionics information
- **Market Analysis**: Calculates average, minimum, maximum, and median prices
- **User-Friendly Interface**: Clean, modern web interface with data tables and visual statistics
- **Responsive Design**: Works on desktop and mobile devices

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
cd Aircraft_market_value_US
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Click "Fetch Latest Listings" to scrape current data from Trade-A-Plane

### Running the Scraper Directly (Testing)

You can also test the scraper independently:
```bash
python scraper.py
```

## Project Structure

```
Aircraft_market_value_US/
├── app.py                 # Flask web application
├── scraper.py             # Web scraping logic
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Web interface
├── static/               # Static files (if needed)
└── README.md             # This file
```

## How It Works

1. **Scraping**: The application uses the `requests` library with proper headers to fetch listing pages from Trade-A-Plane.com
2. **Parsing**: BeautifulSoup parses the HTML and extracts relevant data using regex patterns
3. **Data Collection**: For each listing, the scraper visits individual listing pages to gather detailed information
4. **Analysis**: The application calculates statistics (average, min, max, median) from all collected listings
5. **Display**: The Flask backend serves the data via a REST API to the frontend, which displays it in a user-friendly table

## Data Extracted

For each aircraft listing:
- **Asking Price**: The advertised price
- **Location**: Where the aircraft is located
- **URL**: Link to the original listing
- **Engine Hours**: Total engine hours (SMOH - Since Major Overhaul or TTSN)
- **Propeller Hours**: Total propeller hours
- **Airframe Hours**: Total airframe hours (TTAF)
- **Avionics**: List of avionics equipment mentioned in the listing

## Limitations & Notes

- **Rate Limiting**: The scraper includes delays between requests to be respectful to Trade-A-Plane's servers
- **Anti-Bot Measures**: Trade-A-Plane may implement anti-bot measures. If you encounter 403 errors frequently, you may need to adjust headers or implement additional measures
- **Data Accuracy**: The scraper uses regex patterns to extract data. Not all listings format data consistently, so some fields may be missing
- **Single Model**: Currently configured for Cessna 172N only. Can be extended to other models
- **No Database**: Data is fetched in real-time and not persisted. Each scrape fetches fresh data

## Future Enhancements

- [ ] Support for multiple aircraft models
- [ ] Database integration to track price trends over time
- [ ] Price history charts and analytics
- [ ] Filtering and sorting options
- [ ] Export data to CSV/Excel
- [ ] Email alerts for price changes
- [ ] Selenium integration for JavaScript-heavy content
- [ ] More sophisticated avionics parsing

## Legal & Ethical Considerations

- This scraper is for personal use and educational purposes
- Always respect Trade-A-Plane's terms of service
- Use reasonable rate limiting (implemented)
- Consider contacting Trade-A-Plane if you need large-scale data access
- The scraper should not be used to harm or overload their servers

## Troubleshooting

### 403 Forbidden Error
If you get 403 errors when scraping:
- The website may have detected automated access
- Try increasing delays between requests in `scraper.py`
- Consider implementing Selenium for browser-like behavior

### No Data Found
If no listings are returned:
- The HTML structure of Trade-A-Plane may have changed
- Check the URL pattern is still valid
- Inspect the page source and update selectors in `scraper.py`

### Missing Data Fields
If some fields are not extracted:
- Not all listings provide complete information
- The regex patterns may need adjustment
- Check individual listing pages to verify data availability

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

This project is provided as-is for educational purposes.
