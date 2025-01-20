# MTGO deck formatter
Tool to format (or check the format) of a Magic: the Gathering Online (MTGO) TXT deck list.

Since the sort order of MTGO txt list is not alphabetical, versioning these files is a mess.
This tools sorts the cards in the deck lists, while keeping main board and side board intact.

## Requirements
- NodeJS (>=18)

## Installation
`npm install -g mtgo-deck-formatter`

## Usage
- `mtgo-deck-formatter -w decklist.txt another-decklist.txt ...` (or `--write`)
  
  Sorts the deck list alphabetically (ignores card amounts) and overwrites the existing file.
  

- `mtgo-deck-formatter -c decklist.txt` (or `--check`)
  
  Checks format of all supplied deck lists, exits with error if at least one list has invalid format.


- `mtgo-deck-formatter -p decklist.txt` (or `--print`)

  Sorts the deck list alphabetically (ignores card amounts) and prints the formatted deck list.
  Does not overwrite the existing file.


- `mtgo-deck-formatter -h` (or `--help`)
 
  Shows instructions.
