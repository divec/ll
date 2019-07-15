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
	this.langPairsPromise = this.fetchLangPairsPromise();
};

/* Initialization */

OO.initClass( ll.Translator );

/* Static methods */

ll.Translator.static.outerSeparator = ':!!!:';

ll.Translator.static.innerSeparator = ':!!:';

/**
 * Bundle groups of strings for translation in one go
 *
 * @param {Array[]} groups Array of Arrays of strings
 * @return {string} The groups, joined with separators that break sentences
 */
ll.Translator.static.bundle = function ( groups ) {
	return groups.map( function ( group ) {
		return group.join( '\n' + this.innerSeparator + '\n' );
	} ).join( '\n' + this.outerSeparator + '\n' );
};

/**
 * Unbundle groups of strings translated in one go
 *
 * @param {string} bundled Bundled groups, as returned by #bundle
 * @return {Array[]} Array of Arrays of strings
 */
ll.Translator.static.unbundle = function ( bundled ) {
	var innerPattern = new RegExp( '\\s*' + this.innerSeparator + '\\s*' ),
		outerPattern = new RegExp( '\\s*' + this.outerSeparator + '\\s*' );
	return bundled.split( outerPattern ).map(
		function ( groupString ) {
			return groupString.split( innerPattern );
		}
	);
};

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
ll.Translator.prototype.getLangPairsPromise = function () {
	return this.langPairsPromise;
};

ll.Translator.prototype.fetchLangPairsPromise = null;

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

/**
 * Translate plaintext
 *
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @param {string} text The text to translate
 * @return {Promise} Promise resolving with the translated text
 */
ll.Translator.prototype.translatePlaintext = function ( sourceLang, targetLang ) {
	var translator = this;

	return this.getLangPairsPromise().then( function ( langPairs ) {
		if ( !translator.pairSupported( langPairs, sourceLang, targetLang ) ) {
			throw new Error( 'Unsupported language pair "' + sourceLang + '"" > "' + targetLang + '"' );
		}
	} );
};

/**
 * Translate chunked text
 *
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @param {ll.ChunkedText[]} sourceTexts The text to translate
 * @return {Promise} Promise resolving with the translated text
 */
ll.Translator.prototype.translate = function ( sourceLang, targetLang, sourceTexts ) {
	var plexSourceGroups,
		translator = this;

	/**
	 * From chunked text, derive a list of plaintext strings, one with each annotated chunk
	 * with that chunk upper cased, plus one for the whole string.
	 *
	 * For example chunked text corresponding to 'foo <b>bar</b> baz <b>qux</b> quux', return:
	 * [
	 *     'foo BAR baz qux quux',
	 *     'foo bar baz QUX quux',
	 *     'foo bar baz qux quux'
	 * ]
	 * @param {ll.ChunkedText} chunked The chunked text
	 * @return {string[]} The corresponding plaintext strings
	 */
	function getPlexGroup( chunked ) {
		var outputList = [];
		chunked.chunks.forEach( function ( chunk ) {
			outputList.push( chunked.allText.slice( 0, chunk.start ) +
				chunk.text.toUpperCase() +
				chunked.allText.slice( chunk.start + chunk.text.length )
			);
		} );
		outputList.push( chunked.allText );
		return outputList;
	}

	plexSourceGroups = sourceTexts.map( getPlexGroup );

	return this.translatePlaintext(
		sourceLang,
		targetLang,
		this.constructor.static.bundle( plexSourceGroups )
	).then( function ( modifiedTargetsBundle ) {
		var modifiedTargetsList = translator.constructor.static.unbundle( modifiedTargetsBundle );
		return modifiedTargetsList.map( function ( modifiedTargets, i ) {
			var targetPlainText = modifiedTargets.pop();
			return ll.adaptAnnotationsWithModifiedTargets( sourceTexts[ i ], targetPlainText, modifiedTargets );
		} );
	} );
};
