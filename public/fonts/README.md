# Fonts Directory

Place your font files here:

- `GoogleSans-Bold.ttf` - Google Sans Bold font file (Logo font)
- `GoogleSans-Regular.ttf` - Google Sans Regular font file
- `GoogleSans-Medium.ttf` - Google Sans Medium font file
- `GoogleSans-Italic.ttf` - Google Sans Italic font file
- `GoogleSans-BoldItalic.ttf` - Google Sans Bold Italic font file
- `GoogleSans-MediumItalic.ttf` - Google Sans Medium Italic font file
- `nordiquepro-semibold.otf` - Legacy Nordique Pro font (deprecated)

## Font Usage

The Google Sans Bold font is used for the logo and branding elements throughout the application.

## Font Conversion (Optional)

To convert TTF to WOFF2 for better web performance:

1. Use online converters like:
   - https://convertio.co/ttf-woff2/
   - https://cloudconvert.com/ttf-to-woff2

2. Or use command line tools:
   ```bash
   # Install fonttools
   pip install fonttools[woff]
   
   # Convert TTF to WOFF2
   pyftsubset GoogleSans-Bold.ttf --output-file=GoogleSans-Bold.woff2 --flavor=woff2
   ```

## File Structure
```
public/fonts/
├── GoogleSans-Bold.ttf
├── GoogleSans-Regular.ttf
├── GoogleSans-Medium.ttf
├── GoogleSans-Italic.ttf
├── GoogleSans-BoldItalic.ttf
├── GoogleSans-MediumItalic.ttf
└── nordiquepro-semibold.otf (legacy)
```
