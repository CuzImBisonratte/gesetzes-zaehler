// 
// Modules
// 
const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const converter = new showdown.Converter({
    simpleLineBreaks: true,
    metadata: true,
    openLinksInNewWindow: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    underline: true
});
const ProgressBar = require('progress');

// 
// Move for own folder structure
// 
const srcPath = path.join(__dirname, 'src');
const srcModPath = path.join(__dirname, 'src_mod');
const gesetzePath = path.join(srcPath, 'gesetze');
const gesetzeModPath = path.join(srcModPath, 'gesetze');

// Clean src_mod folder
if (fs.existsSync(srcModPath)) fs.rmSync(srcModPath, { recursive: true });
if (!fs.existsSync(srcModPath)) fs.mkdirSync(srcModPath);
if (!fs.existsSync(gesetzeModPath)) fs.mkdirSync(gesetzeModPath);

// Copy files
fs.readdirSync(gesetzePath).forEach((dir) => {
    // Skip .git folder and other files
    if (dir === '.git' || dir === 'README.md' || dir === 'LICENSE') return;

    const dirPath = path.join(gesetzePath, dir);
    const dirModPath = path.join(gesetzeModPath, dir);

    fs.readdirSync(dirPath).forEach((file) => {
        const filePath = path.join(dirPath, file);
        const fileModPath = path.join(gesetzeModPath, file);

        // Copy dir
        fs.cpSync(filePath, fileModPath, { recursive: true });
    });
});

// 
// Go through all gesetze files
//
const gesetzeFiles = fs.readdirSync(gesetzeModPath);
const gesetze = [];
var currentGesetz = 0;
var bar = new ProgressBar('Processing since :elapseds... :percent [:bar] :etas remaining', { total: gesetzeFiles.length, complete: '█', incomplete: '░' });
gesetzeFiles.forEach((file) => {
    // Status message
    bar.tick();

    // Read file
    const filePath = path.join(gesetzeModPath, file, "index.md");
    const data = fs.readFileSync(filePath, 'utf8');
    converter.makeHtml(data);
    var meta = converter.getMetadata();
    const cleanData = data.split('---')[2].trim();

    meta.lines = cleanData.split('\n').length;
    meta.words = cleanData.split(' ').length;

    // Push to gesetze array
    gesetze.push(meta);
});

// Add numbers together
var totalLines = 0;
var totalWords = 0;
gesetze.forEach((gesetz) => {
    totalLines += gesetz.lines;
    totalWords += gesetz.words;
});
console.log(`Total lines: ${totalLines}\nTotal words: ${totalWords}`);
fs.writeFileSync('gesetze.json', JSON.stringify(gesetze, null, 4));

// 
// Fine analysis
//
console.log('Starting Fine analysis...');
var bar = new ProgressBar('Processing since :elapseds... :percent [:bar] :etas remaining', { total: totalLines, complete: '█', incomplete: '░' });
var numOfParagraphs = 0;
var numOfArticles = 0;
var numOfAbsatz = 0;
var words = {};
gesetzeFiles.forEach((file) => {
    // Read file
    const filePath = path.join(gesetzeModPath, file, "index.md");
    const data = fs.readFileSync(filePath, 'utf8');
    const cleanData = data.split('---')[2].trim();

    // Split lines
    const lines = cleanData.split('\n');
    lines.forEach((line) => {
        bar.tick();

        // Check for fine analysis data
        if (line.startsWith('### § ')) numOfParagraphs++;
        if (line.startsWith('### Art ')) numOfArticles++;
        if (line.match(/^\(\d+\)/)) numOfAbsatz++;

        // Split words
        const wordsData = line.split(' ');
        wordsData.forEach((word) => {
            words[word] = (words[word] || 0) + 1;
        });
    });
});

// Sort words by count
words = Object.entries(words).sort((a, b) => b[1] - a[1]);
words = Object.fromEntries(words);

fs.writeFileSync('words.json', JSON.stringify(words, null, 4));

console.log(`Number of Paragraphs: ${numOfParagraphs}\nNumber of Articles: ${numOfArticles}\nNumber of Absatz: ${numOfAbsatz}`);