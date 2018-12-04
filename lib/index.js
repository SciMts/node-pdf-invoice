const pdfKit = require('pdfkit');
const {format} = require('date-fns');
const i18n = require('./i18n');

const TEXT_SIZE = 8;
const CONTENT_LEFT_PADDING = 50;

function PDFInvoice({
	company, // {phone, email, address}
	recipients, // {name, email}
	manuscript
}) {
	const items = [
		{
			name: 'Article processing fee',
			description: 'Manuscript number ' + manuscript.manuscript_number,
			quantity: 1,
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
		return i * 150;
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
					.text('PAID', CONTENT_LEFT_PADDING, 105, {align: 'right'})
					.font('Helvetica');
			}
			doc
				.fontSize(TEXT_SIZE)
				.fillColor('#000000')
				.font('Helvetica-Bold')
				.text('Recipients', CONTENT_LEFT_PADDING, 130, {
					align: 'right'
				})
				.font('Helvetica')
				.text(recipients.map(r => r.name).join('\n'), {
					align: 'right'
				});

			doc
				.font('Helvetica-Bold')

				.text('\nReceipt generated', {
					align: 'right'
				})
				.font('Helvetica')
				.text(format(Date.now(), 'MMM do, yyyy'), {
					align: 'right'
				})

				.fillColor('#000000');
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
			doc.fontSize(TEXT_SIZE).text(company.name, CONTENT_LEFT_PADDING, 100);

			doc.text(company.address);
			doc.text(company.phone);
			doc.text(company.email);

			doc.fillColor('#333333');
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
						', the article processing fee has been waived for you.'
				);
			} else {
				doc.text(
					'Our bank connection:\nRecipient: Sciencematters AG\nBank: Credit Suisse (Schweiz) AG, 8070 Zürich\nIBAN: CH23 0483 5186 4602 8100 0'
				);
			}
		},

		genTableHeaders() {
			['quantity', 'name', 'description', 'amount'].forEach((text, i) => {
				doc
					.fontSize(TEXT_SIZE)
					.text(translate[text], table.x + getInc(i), table.y);
			});
		},

		genTableRow() {
			items
				.map(item =>
					Object.assign({}, item, {
						amount: item.amount
					})
				)
				.forEach((item, itemIndex) => {
					['quantity', 'name', 'description', 'amount'].forEach((field, i) => {
						doc
							.fontSize(TEXT_SIZE)
							.text(
								item[field],
								table.x + getInc(i),
								table.y + TEXT_SIZE + 6 + itemIndex * 20
							);
					});
				});
		},

		genTableLines() {
			const offset = doc.currentLineHeight() + 2;
			doc
				.moveTo(table.x, table.y + offset)
				.lineTo(divMaxWidth, table.y + offset)
				.stroke();
		},

		generate() {
			this.genHeader();
			this.genTableHeaders();
			this.genTableLines();
			this.genTableRow();
			this.genCustomerInfos();
			this.genFooter();

			doc.end();
		},

		get pdfkitDoc() {
			return doc;
		}
	};
}

PDFInvoice.lang = 'en_US';

module.exports = PDFInvoice;
