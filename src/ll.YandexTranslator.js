/*!
 * LL two-way parallel translation - Yandex translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Yandex translator
 * @abstract
 * @class
 *
 * @constructor
 */
ll.YandexTranslator = function LLYandexTranslator() {
	this.url = 'https://translate.yandex.net/api/v1.5/tr.json';
	this.key = '<APIKEY>';

	ll.YandexTranslator.super.call( this );
};

/* Initialization */

OO.inheritClass( ll.YandexTranslator, ll.Translator );

ll.YandexTranslator.static.outerSeparator = ':!!!:';

ll.YandexTranslator.static.innerSeparator = ':!!:';

/* Instance methods */

ll.YandexTranslator.prototype.fetchLangPairsPromise = function () {
	return $.ajax( {
		url: this.url + '/getLangs',
		datatype: 'json',
		data: {
			key: this.key
		}
	} ).then( function ( data ) {
		return data.dirs.map( function ( pair ) {
			var parts = pair.split( '-' );
			return {
				source: parts[ 0 ],
				target: parts[ 1 ]
			};
		} );
	} );
};

/**
 * Translate plaintext
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @param {string} text The text to translate
 * @return {Promise} Promise resolving with the translated text
 */
ll.YandexTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, text ) {
	return $.ajax( {
		url: this.url + '/translate',
		method: 'post',
		datatype: 'json',
		data: {
			key: this.key,
			lang: sourceLang + '-' + targetLang,
			text: text
		}
	} ).then( function ( data ) {
		return data.text[ 0 ];
	} );
};
