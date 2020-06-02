/*!
 * LL two-way parallel translation - Apertium translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Apertium translator, using apertium-apy
 *
 * See https://github.com/apertium/apertium-apy
 *
 * @abstract
 * @class
 *
 * @constructor
 * @param {Object} [config] Config
 * @param {string} [config.url] URL of apertium-apy instance
 * @param {string} [url] URL of apertium-apy instance (deprecated)
 */
ll.ApertiumTranslator = function LLApertiumTranslator() {
	var config;
	if ( typeof arguments[ 0 ] === 'string' ) {
		config = { url: arguments[ 0 ] };
	} else if ( !arguments[ 0 ] ) {
		throw new Error( 'Need Apertium config' );
	} else {
		config = arguments[ 0 ];
	}
	if ( !config.url ) {
		throw new Error( 'Need Apertium URL' );
	}
	this.url = config.url;
	ll.ApertiumTranslator.super.call( this );
};

/* Initialization */

OO.inheritClass( ll.ApertiumTranslator, ll.Translator );

/* Static properties */

ll.ApertiumTranslator.static.codeFromIso = {
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

/* Static methods */

/**
 * Bundle texts for translation in one go
 *
 * @param {string[]} texts
 * @return {string} The texts, joined with separators that break sentences
 */
ll.ApertiumTranslator.static.bundle = function ( texts ) {
	return texts.join( '\n:!!:\n' );
};

/**
 * Unbundle texts translated in one go
 *
 * @param {string} bundled Bundled texts, as returned by #bundle
 * @return {string[]} The unbundled texts
 */
ll.ApertiumTranslator.static.unbundle = function ( bundled ) {
	return bundled.split( /(?:\s*\n|^):!!:(?:\n\s*|$)/ );
};

/* Instance methods */

/**
 * @inheritdoc
 */
ll.ApertiumTranslator.prototype.fetchLangPairsPromise = function () {
	return $.ajax( {
		url: this.url + '/list',
		datatype: 'json'
	} ).then( function ( data ) {
		return data.responseData.map( function ( pair ) {
			// Mapping to ISO is done by parent
			return {
				source: pair.sourceLanguage,
				target: pair.targetLanguage
			};
		} );
	} );
};

/**
 * @inheritdoc
 */
ll.ApertiumTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, texts ) {
	var text,
		translator = this;
	text = this.constructor.static.bundle( texts );

	return this.checkLangPair( sourceLang, targetLang ).then( function () {
		return $.ajax( {
			url: translator.url + '/translate',
			datatype: 'json',
			data: {
				markUnknown: 'no',
				langpair: translator.getCodeFromIso( sourceLang ) + '|' + translator.getCodeFromIso( targetLang ),
				q: text
			}
		} );
	} ).then( function ( data ) {
		return translator.constructor.static.unbundle( data.responseData.translatedText );
	} );
};
