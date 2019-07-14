/*!
 * LL two-way parallel translation - Apertium translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Apertium translator
 * @abstract
 * @class
 *
 * @constructor
 * @param {string} url URL of apertium-apy instance; see https://github.com/apertium/apertium-apy
 */
ll.ApertiumTranslator = function LLApertiumTranslator( url ) {
	this.url = url;
	ll.ApertiumTranslator.super.call( this );
};

/* Initialization */

OO.inheritClass( ll.ApertiumTranslator, ll.Translator );

/* Static properties */

ll.ApertiumTranslator.static.apertiumFromIso = {
	af: 'afr',
	an: 'arg',
	ar: 'ara',
	ast: 'ast',
	be: 'bel',
	bg: 'bul',
	br: 'bre',
	bs: 'hbs_BS',
	ca: 'cat',
	'crh-latn': 'crh',
	cy: 'cym',
	da: 'dan',
	en: 'eng',
	eo: 'epo',
	es: 'spa',
	eu: 'eus',
	fr: 'fra',
	gl: 'glg',
	hi: 'hin',
	hr: 'hbs_HR',
	id: 'ind',
	is: 'isl',
	it: 'ita',
	kk: 'kaz',
	la: 'lat',
	mk: 'mkd',
	ms: 'msa',
	mt: 'mlt',
	nl: 'nld',
	nb: 'nob',
	nn: 'nno',
	no: 'nob',
	oc: 'oci',
	pt: 'por',
	ro: 'ron',
	ru: 'rus',
	sc: 'srd',
	se: 'sme',
	sh: 'hbs',
	sl: 'slv',
	sr: 'hbs_SR',
	sv: 'swe',
	tr: 'tur',
	tt: 'tat',
	uk: 'ukr',
	ur: 'urd'
};

ll.ApertiumTranslator.static.isoFromApertium = ( function () {
	var apertiumFromIso = ll.ApertiumTranslator.static.apertiumFromIso,
		isoFromApertium = {};
	Object.keys( apertiumFromIso ).forEach( function ( iso ) {
		isoFromApertium[ apertiumFromIso[ iso ] ] = iso;
	} );
	return isoFromApertium;
}() );

/* Instance methods */

ll.ApertiumTranslator.prototype.fetchLangPairsPromise = function () {
	return $.ajax( {
		url: this.url + '/list',
		datatype: 'json'
	} ).then( function ( data ) {
		var isoFromApertium = ll.ApertiumTranslator.static.isoFromApertium;
		return data.responseData.map( function ( pair ) {
			return {
				source: isoFromApertium[ pair.sourceLanguage ],
				target: isoFromApertium[ pair.targetLanguage ]
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
ll.ApertiumTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, text ) {
	var apertiumFromIso = this.constructor.static.apertiumFromIso,
		translator = this;

	return ll.ApertiumTranslator.super.prototype.translatePlaintext.apply( this, arguments ).then( function () {
		return $.ajax( {
			url: translator.url + '/translate',
			datatype: 'json',
			data: {
				markUnknown: 'no',
				langpair: apertiumFromIso[ sourceLang ] + '|' + apertiumFromIso[ targetLang ],
				q: text
			}
		} ).then( function ( data ) {
			return data.responseData.translatedText;
		} );
	} );
};
