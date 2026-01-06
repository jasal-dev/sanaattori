#!/bin/bash
# Script to download the Kotus Finnish word list

# Create data/raw directory if it doesn't exist
mkdir -p data/raw

# Download the word list
echo "Downloading Kotus word list..."
curl -o data/raw/nykysuomensanalista2024.txt https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt

echo "Download complete: data/raw/nykysuomensanalista2024.txt"
