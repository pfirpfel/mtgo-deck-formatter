const path = require('path');
const fs = require('fs');

function usage() {
  const usage = `Formats mtgo txt deck lists
Usage: node format.js decklist.txt another-list.txt ...
Default behaviour overwrites the supplied files with their formatted version.
-h, --help: show this help text
-c, --check: check format of all supplied decklists, exits with error if at least one list has invalid format
-p, --print: only print, don't overwrite deck list
`;
  console.log(usage);
}

function format(decklist) {
  const newLine = /(\r\n|\r|\n)/g;
  const matches = decklist.match(newLine);
  if (matches === null) {
    console.warn('Invalid format');
    return decklist;
  }
  const newLineCharacter = matches[0];
  const lines = decklist.split(newLine).filter(line => line.match(newLine) == null);
  let blocks = [];
  let currentBlock = [];
  for (let line of lines) {
    if (line.trim() === ''){
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  // sort each block by card name (ignore cad amount)
  for (let i = 0; i < blocks.length; i++) {
    blocks[i] = blocks[i].sort((a, b) => {
      const cardA = a.split(/\s+/).slice(1).join(' ').toUpperCase();
      const cardB = b.split(/\s+/).slice(1).join(' ').toUpperCase();
      if (cardA < cardB) {
        return -1;
      }
      if (cardA > cardB) {
        return 1;
      }
      return 0;
    });
  }
  const formatted = blocks.reduce((acc, block, index) =>  {
    if (index > 0) {
      acc += newLineCharacter + newLineCharacter;
    }
      return acc + block.join(newLineCharacter);
    }, "");
  return formatted + newLineCharacter;
}

if (process.argv.length <= 2) {
  console.log('Provide at least one deck list to format!')
  usage();
}

let arguments = process.argv.slice(2);
if (arguments[0] === '-h' || arguments[0] === '--help') {
  usage();
  process.exit();
}
let checkFormat = false;
let formatValid = true;
if (arguments[0] === '-c' || arguments[0] === '--check') {
  checkFormat = true;
  arguments = arguments.slice(1);
}
let onlyPrintFormatted = false;
if (arguments[0] === '-p' || arguments[0] === '--print') {
  onlyPrintFormatted = true;
  arguments = arguments.slice(1);
}

for (let filepath of arguments) {
  const resolvedPath = path.resolve(filepath);
  // check if file exists
  try {
    fs.accessSync(resolvedPath, fs.F_OK);
  } catch (err) {
    console.warn(`${filepath} does not exist or can't be accessed`);
    continue;
  }
  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const formatted = format(fileContent);
    if (onlyPrintFormatted) {
      console.log(formatted);
    } else if (checkFormat){
      if (fileContent.localeCompare(formatted) !== 0) {
        console.warn(`Format invalid: ${filepath}`);
        formatValid = false;
      }
    } else {
      fs.writeFileSync(resolvedPath, formatted, 'utf8');
    }
  } catch (err) {
    console.error(err)
  }
}

let exitCode = (checkFormat && !formatValid) ? 1 : 0;
process.exit(exitCode);
