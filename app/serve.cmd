@echo off
echo Starting local test server at http://localhost:8080
echo Open http://localhost:8080?test=z17-test in your browser.
echo Press Ctrl+C to stop.
echo.
python -m http.server 8080
