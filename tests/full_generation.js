const fs = require('fs');
const path = require('path');
const generator = require('../dist/index');

const document = generator({
	company: {
		email: 'info@sciencematters.io',
		address: 'Bahnhofstrasse 3\n8003 Zürich',
		name: 'Sciencematters AG'
	},
	customer: {
		name: 'Elliot Raque',
		email: 'raque@gmail.com'
	},
	items: [
		{
			amount: 600.0,
			name: 'Article processing fee',
			description: 'Manuscript number XXXXXXXXX',
			quantity: 1
		}
	]
});

document.generate();

document.pdfkitDoc.pipe(
	fs.createWriteStream(path.join(process.cwd(), 'tests/testing.pdf'))
);
