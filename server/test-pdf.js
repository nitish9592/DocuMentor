// test-pdf.js
import fs from 'fs';
import pdfParse from 'pdf-parse';

const buffer = fs.readFileSync('./uploads/yourfile.pdf');
pdfParse(buffer).then(data => {
  console.log(data.text);
});
