#!/usr/bin/env python3
"""
Build script to generate Finnish word lists for Sanaattori game.

This script parses the Kotus Finnish word list and generates:
- Allowed word lists (all valid words) for 5, 6, and 7 letter words
- Solution word lists (curated subset) for 5, 6, and 7 letter words

The output files are written to data/processed/
"""

import re
from pathlib import Path
from typing import Set


# Allowed characters: a-z, ä, ö, and optionally å
ALLOWED_CHARS = re.compile(r'^[a-zäöå]+$')


def is_valid_word(word: str) -> bool:
    """Check if a word contains only allowed characters."""
    return bool(ALLOWED_CHARS.match(word))


def extract_lemma(line: str) -> str:
    """
    Extract the lemma (base form) from a Kotus word list line.
    
    The Kotus format is typically: lemma<tab>inflection_class<tab>...
    We only need the first field (lemma).
    """
    # Split on tab and take the first field
    parts = line.split('\t')
    if parts:
        return parts[0].strip().lower()
    return ''


def process_wordlist(input_file: Path, output_dir: Path) -> None:
    """
    Process the Kotus word list and generate length-specific word lists.
    
    Args:
        input_file: Path to the raw Kotus word list
        output_dir: Directory where processed files will be written
    """
    print(f"Processing word list from: {input_file}")
    
    # Collections for different word lengths
    words_by_length = {5: set(), 6: set(), 7: set()}
    
    # Read and process the input file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Extract the lemma
                word = extract_lemma(line)
                
                # Skip if empty after extraction
                if not word:
                    continue
                
                # Check if it's a valid word
                if not is_valid_word(word):
                    continue
                
                # Add to appropriate length category
                word_len = len(word)
                if word_len in words_by_length:
                    words_by_length[word_len].add(word)
    
    except FileNotFoundError:
        print(f"ERROR: Input file not found: {input_file}")
        print("Please download the word list using: ./scripts/download_wordlist.sh")
        print("Or manually download from: https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt")
        return
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write output files for each length
    for length, words in words_by_length.items():
        if not words:
            print(f"Warning: No words found for length {length}")
            continue
        
        # Sort words for deterministic output
        sorted_words = sorted(words)
        
        # Write allowed words (all valid words)
        allowed_file = output_dir / f"fi_allowed_{length}.txt"
        with open(allowed_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted_words) + '\n')
        print(f"✓ Created {allowed_file} with {len(sorted_words)} words")
        
        # Write solution words (same as allowed for now; can be curated later)
        # In a production game, you might want to filter out obscure words
        solutions_file = output_dir / f"fi_solutions_{length}.txt"
        with open(solutions_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted_words) + '\n')
        print(f"✓ Created {solutions_file} with {len(sorted_words)} words")


def main():
    """Main entry point."""
    # Paths
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    input_file = project_dir / 'data' / 'raw' / 'nykysuomensanalista2024.txt'
    output_dir = project_dir / 'data' / 'processed'
    
    print("=" * 60)
    print("Finnish Word List Builder for Sanaattori")
    print("=" * 60)
    
    # Process the word list
    process_wordlist(input_file, output_dir)
    
    print("=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == '__main__':
    main()
