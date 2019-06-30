/*!
 * LL two-way parallel translation - Translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Abstract class implementing a translator
 * @abstract
 * @class
 *
 * @constructor
 */
ll.Translator = function LLTranslator() {
};

/* Initialization */

OO.initClass( ll.Translator );

/* Instance methods */

/**
 * Machine translate chunked source
 *
 * @param {string} sourceLang Source language code; only en|es are supported right now
 * @param {string} targetLang Target language code; only es|en are supported right now
 * @param {ll.ChunkedText[]} texts Texts to translate
 * @return {Promise} Promise resolving with translated ll.ChunkedText[]
 */
ll.Translator.prototype.translate = null;

/**
 * Get available language pairs
 * @return {Promise} Promise resolving with list of [{source:'source',target:'target'}]
 */
ll.Translator.prototype.getLangPairsPromise = null;

ll.Translator.prototype.getParallelLangPairsPromise = function () {
	return this.getLangPairsPromise().then( function ( pairs ) {
		var pairsObject = {};
		pairs.forEach( function ( pair ) {
			pairsObject[ pair.source + '|' + pair.target ] = true;
		} );
		return pairs.filter( function ( pair ) {
			return pairsObject[ pair.target + '|' + pair.source ];
		} );
	} );
};

ll.Translator.prototype.pairSupported = function ( langPairs, source, target ) {
	return langPairs.some( function ( pair ) {
		return pair.source === source && pair.target === target;
	} );
};
