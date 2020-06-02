/*!
 * LL two-way parallel translation - Yandex translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Yandex translator
 *
 * @abstract
 * @class
 *
 * @constructor
 * @param {Object} config
 * @param {string} config.key API key
 */
ll.YandexTranslator = function LLYandexTranslator( config ) {
	this.url = 'https://translate.yandex.net/api/v1.5/tr.json';
	if ( !config.key ) {
		throw new Error( 'Need Yandex API key' );
	}
	this.key = config.key;
	// Parent constructor: must be called after setting .url and .key above
	ll.YandexTranslator.super.call( this );
};

/* Initialization */

OO.inheritClass( ll.YandexTranslator, ll.Translator );

ll.YandexTranslator.static.outerSeparator = ':!!!:';

ll.YandexTranslator.static.innerSeparator = ':!!:';

/* Instance methods */

/**
 * @inheritdoc
 */
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
			// Mapping to ISO is done by parent
			return {
				source: parts[ 0 ],
				target: parts[ 1 ]
			};
		} );
	} );
};

/**
 * @inheritdoc
 */
ll.YandexTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, texts ) {
	var translator = this;
	return $.ajax( {
		url: this.url + '/translate',
		method: 'post',
		datatype: 'json',
		data: {
			key: this.key,
			lang: translator.getCodeFromIso( sourceLang ) + '-' + translator.getCodeFromIso( targetLang ),
			text: texts
		},
		traditional: true
	} ).then( function ( data ) {
		return data.text;
	} );
};
