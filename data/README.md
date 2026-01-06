# Finnish Word Lists

This directory contains Finnish word lists used in the Sanaattori word game.

## Source

The raw word list is derived from:

**Kotus: Nykysuomen sanalista 2024**

- Source URL: https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt
- Publisher: Institute for the Languages of Finland (Kotus)

## License

The word list is licensed under:

**Creative Commons Attribution 4.0 International (CC BY 4.0)**

- License URL: https://creativecommons.org/licenses/by/4.0/
- You are free to:
  - Share — copy and redistribute the material in any medium or format
  - Adapt — remix, transform, and build upon the material for any purpose, even commercially
- Under the following terms:
  - Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made

## Attribution

This project uses word list data from Kotus (Institute for the Languages of Finland), licensed under CC BY 4.0.

## Directory Structure

- `raw/` - Original downloaded word lists
- `processed/` - Processed word lists for use in the game:
  - `fi_allowed_5.txt` - All valid 5-letter Finnish words
  - `fi_allowed_6.txt` - All valid 6-letter Finnish words
  - `fi_allowed_7.txt` - All valid 7-letter Finnish words
  - `fi_solutions_5.txt` - Solution candidates for 5-letter words
  - `fi_solutions_6.txt` - Solution candidates for 6-letter words
  - `fi_solutions_7.txt` - Solution candidates for 7-letter words

## Usage

To download the raw word list:

```bash
./scripts/download_wordlist.sh
```

**Note:** If the download fails due to network restrictions, you can manually download the file from https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt and place it in `data/raw/nykysuomensanalista2024.txt`.

To generate processed word lists:

```bash
python scripts/build_wordlists.py
```
