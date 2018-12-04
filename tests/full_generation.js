const fs = require('fs');
const path = require('path');
const generator = require('../dist/index');

const receipt1 = {
	payment_info: {
		type: 'card',
		receipt: {
			maskedNumber: '524886******1571',
			issuer: 'MasterCard',
			issuerImage:
				'https://assets.braintreegateway.com/payment_method_logo/mastercard.png?environment=production',
			transactionId: '11e4ywyh',
			amount: '294.00',
			currency: 'CHF',
			timestamp: 1507296820615.0
		}
	},
	manuscript_number: '201801000001',
	state_transitions: [
		{
			from_state: 'draft',
			to_state: 'submitted',
			date: 1446756233496.0
		},
		{
			from_state: 'submitted',
			to_state: 'rejected',
			date: null
		}
	]
};

const receipt2 = {
	payment_info: {
		type: 'free-submission',
		institution: 'University of Zurich (UZH)'
	},
	state_transitions: [
		{
			from_state: 'draft',
			to_state: 'submitted',
			date: 1446756233496.0
		},
		{
			from_state: 'submitted',
			to_state: 'rejected',
			date: null
		}
	],
	manuscript_number: '201801000001'
};

const receipt3 = {
	payment_info: null,
	manuscript_number: '201801000001',
	state_transitions: [
		{
			from_state: 'draft',
			to_state: 'submitted',
			date: 1446756233496.0
		},
		{
			from_state: 'submitted',
			to_state: 'rejected',
			date: null
		}
	]
};

[receipt1, receipt2, receipt3].forEach((manuscript, i) => {
	const document = generator({
		company: {
			email: 'info@sciencematters.io',
			address: 'Bahnhofstrasse 3\n8003 Zürich\nSwitzerland\n\n',
			name: 'Sciencematters AG'
		},
		manuscript,
		recipients: [
			{name: 'Jonny Burger', affiliation: 'Jonny Burger Hacker Company'},
			{name: 'Lucas Pelloni', affiliation: 'University of Zurich'}
		]
	});

	document.generate();

	document.pdfkitDoc.pipe(
		fs.createWriteStream(
			path.join(process.cwd(), 'tests/testing-' + (i + 1) + '.pdf')
		)
	);
});
