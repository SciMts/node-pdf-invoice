const pdfKit = require('pdfkit');
const {format} = require('date-fns');
const i18n = require('./i18n');

const TEXT_SIZE = 8;
const CONTENT_LEFT_PADDING = 50;

function PDFInvoice({
	company, // {phone, email, address}
	recipients, // {name, email}
	manuscript,
	chfAmount
}) {
	const items = [
		{
			name: 'Article Processing Fee',
			description: 'Manuscript number ' + manuscript.manuscript_number,
			quantity: 1,
			tax: '0.0%',
			amount:
				manuscript.payment_info && manuscript.payment_info.type === 'card'
					? manuscript.payment_info.receipt.currency +
					  ' ' +
					  manuscript.payment_info.receipt.amount
					: 'USD 595'
		}
	];
	const doc = new pdfKit({size: 'A4', margin: 50});

	doc.fillColor('#333333');

	const translate = i18n[PDFInvoice.lang];

	const divMaxWidth = 550;
	const table = {
		x: CONTENT_LEFT_PADDING,
		y: 300
	};

	const getInc = i => {
		if (i === 1) {
			return i * 50;
		}
		if (i === 2) {
			return i * 100;
		}
		if (i === 4) {
			return i * 120 - 50;
		}
		return i * 120;
	};

	const isPaid = m => {
		if (m.payment_info && m.payment_info.type === 'card') {
			return true;
		}
		if (m.payment_info && m.payment_info.type === 'free-submission') {
			return true;
		}
		return false;
	};

	return {
		genHeader() {
			doc.image('lib/logo.png', CONTENT_LEFT_PADDING - 5, 40, {width: 200});
			if (isPaid(manuscript)) {
				doc
					.fontSize(16)
					.fillColor('#db3737')
					.font('Helvetica-Bold')
					.text('PAID', CONTENT_LEFT_PADDING, 40, {align: 'right'})
					.font('Helvetica');
			}
			doc
				.fontSize(TEXT_SIZE)
				.fillColor('#000000')
				.font('Helvetica-Bold')
				.text('Invoice number', CONTENT_LEFT_PADDING, 130, {
					align: 'right'
				})
				.font('Helvetica')
				.text(manuscript.manuscript_number + '\n\n', {
					align: 'right'
				})
				.fontSize(TEXT_SIZE)
				.fillColor('#000000')
				.font('Helvetica-Bold')
				.text('Recipients', {
					align: 'right'
				})
				.font('Helvetica')
				.text(recipients.map(r => r.name).join('\n'), {
					align: 'right'
				});

			doc
				.font('Helvetica-Bold')

				.text('\nSubmission Date', {
					align: 'right'
				})
				.text('Invoice date', {
					align: 'right'
				})
				.font('Helvetica')
				.text(
					format(
						manuscript.state_transitions.find(s => s.to_state === 'submitted')
							.date,
						'MMM do, yyyy'
					),
				{
					align: 'right'
				}
				)

				.fillColor('#000000');
		},

		genFooter() {
			doc.fontSize(TEXT_SIZE).text(company.name, CONTENT_LEFT_PADDING, 130);

			doc.text(company.address);
			doc.text(company.phone);
			doc.text(company.email);
		},

		genCustomerInfos() {
			doc.fontSize(TEXT_SIZE).text('', CONTENT_LEFT_PADDING, 400);
			if (manuscript.payment_info && manuscript.payment_info.type === 'card') {
				doc.text(
					`We charged your ${
						manuscript.payment_info.receipt.issuer
					} ending with ****${manuscript.payment_info.receipt.maskedNumber.substr(
						manuscript.payment_info.receipt.maskedNumber.length - 4,
						4
					)} on ${format(
						manuscript.payment_info.receipt.timestamp,
						"MMMM do, yyyy 'at' HH:mm"
					)} for ${manuscript.payment_info.receipt.currency} ${
						manuscript.payment_info.receipt.amount
					}.\nThanks for your business!`
				);
			} else if (
				manuscript.payment_info &&
				manuscript.payment_info.type === 'free-submission' &&
				manuscript.payment_info.institution.match(/paypal/gi)
			) {
				doc.text('The amount was paid in full via PayPal.');
			} else if (
				manuscript.payment_info &&
				manuscript.payment_info.type === 'free-submission'
			) {
				doc.text(
					'Because you are affiliated with ' +
						manuscript.payment_info.institution +
						', the article processing fee has been waived for you.\n\nThank you for publishing with Sciencematters!'
				);
			} else {
				doc
					.font('Helvetica-Bold')
					.text('\nPay via Credit Card')
					.font('Helvetica')
					.text(
						[
							'https://sciencematters.io/manuscript/' +
								manuscript.manuscript_number +
								'/payment',

							'A staff member of ScienceMatters will charge your card.'
						].join('\n')
					);
				doc
					.font('Helvetica-Bold')
					.text('\nPay via PayPal')
					.font('Helvetica')
					.text('info@sciencematters.io');
				doc
					.font('Helvetica-Bold')
					.text('\nPay via Bank transfer in US Dollars')
					.font('Helvetica')
					.text(
						[
							'Recipient: Sciencematters AG, Bahnhofstrasse 3, 8001 Zürich',
							'Bank: Credit Suisse (Schweiz) AG, 8070 Zürich',
							'IBAN: CH86 0483 5186 4602 8200 0'
						].join('\n')
					);
				doc
					.font('Helvetica-Bold')
					.text(`\nPay via Bank Transfer in Swiss Francs (${chfAmount})`)
					.font('Helvetica')
					.text(
						[
							'Recipient: Sciencematters AG, Bahnhofstrasse 3, 8001 Zürich',
							'Bank: Credit Suisse (Schweiz) AG, 8070 Zürich',
							'IBAN: CH23 0483 5186 4602 8100 0'
						].join('\n')
					)
					.text(
						'\nWhen paying via PayPal or bank transfer, lease reference the invoice number.'
					);
			}
		},

		genTableHeaders() {
			['quantity', 'name', 'description', 'tax', 'amount'].forEach(
				(text, i) => {
					doc
						.fontSize(TEXT_SIZE)
						.text(translate[text], table.x + getInc(i), table.y);
				}
			);
		},

		genTableRow() {
			items
				.map(item =>
					Object.assign({}, item, {
						amount: item.amount
					})
				)
				.forEach((item, itemIndex) => {
					['quantity', 'name', 'description', 'tax', 'amount'].forEach(
						(field, i) => {
							doc
								.fontSize(TEXT_SIZE)
								.text(
									item[field],
									table.x + getInc(i),
									table.y + TEXT_SIZE + 6 + itemIndex * 20
								);
						}
					);
				});
		},

		genTableLines() {
			const offset = doc.currentLineHeight() + 2;
			doc
				.moveTo(table.x, table.y + offset)
				.lineTo(divMaxWidth, table.y + offset)
				.stroke();
		},

		getFooterLogo() {
			doc
				.fillOpacity(0.5)
				.image('lib/logo-gray.png', CONTENT_LEFT_PADDING, 776, {width: 20});
			doc
				.fontSize(TEXT_SIZE)
				.fillColor('#555555')
				.text(
					'Generated on ' + format(Date.now(), 'MMMM do, yyyy'),
					CONTENT_LEFT_PADDING + 33,
					782,
					{align: 'right'}
				);
		},

		generate() {
			this.genHeader();
			this.genTableHeaders();
			this.genTableLines();
			this.genTableRow();
			this.genCustomerInfos();
			this.genFooter();
			this.getFooterLogo();

			doc.end();
		},

		get pdfkitDoc() {
			return doc;
		}
	};
}

PDFInvoice.lang = 'en_US';

module.exports = PDFInvoice;
