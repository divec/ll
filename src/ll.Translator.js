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
	var translator = this;
	this.langPairsPromise = this.fetchLangPairsPromise().then( function ( pairs ) {
		return pairs.map( function ( pair ) {
			return {
				source: translator.getIsoFromCode( pair.source ),
				target: translator.getIsoFromCode( pair.target )
			};
		} );
	} );
};

/* Initialization */

OO.initClass( ll.Translator );

/* Static methods */

ll.Translator.static.outerSeparator = ':!!!:';

ll.Translator.static.innerSeparator = ':!!:';

/**
 * Mapping from ISO code to any non-standard codes.
 *
 * @type {Object}
 */
ll.Translator.static.codeFromIso = {};

/**
 * Bundle groups of strings for translation in one go
 *
 * @param {Array[]} groups Array of Arrays of strings
 * @return {string} The groups, joined with separators that break sentences
 */
ll.Translator.static.bundle = function ( groups ) {
	var innerSeparator = this.innerSeparator;
	return groups.map( function ( group ) {
		return group.join( '\n' + innerSeparator + '\n' );
	} ).join( '\n' + this.outerSeparator + '\n' );
};

/**
 * Unbundle groups of strings translated in one go
 *
 * @param {string} bundled Bundled groups, as returned by #bundle
 * @return {Array[]} Array of Arrays of strings
 */
ll.Translator.static.unbundle = function ( bundled ) {
	// TODO: Regex-escape the separator strings
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
 * Get available language pairs, using ISO codes
 *
 * @return {Promise} Promise resolving with list of [{source:'source',target:'target'}]
 */
ll.Translator.prototype.getLangPairsPromise = function () {
	return this.langPairsPromise;
};

/**
 * Fetch the available language pairs.
 *
 * Non-standard codes will get converted by #getIsoFromCode.
 *
 * @method
 * @return {Promise} Promise resolving with list of [{source:'source',target:'target'}]
 */
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

/**
 * Check if a language pair is supported
 *
 * @param {Array} langPairs Result of #getLangPairsPromise promise
 * @param {string} source Source language ISO code
 * @param {string} target Target language ISO code
 * @return {boolean} Pair is supported
 */
ll.Translator.prototype.pairSupported = function ( langPairs, source, target ) {
	return langPairs.some( function ( pair ) {
		return pair.source === source && pair.target === target;
	} );
};

/**
 * Get the translator's language code from the ISO code
 *
 * @param {string} iso ISO language code
 * @return {string} Translator's language code
 */
ll.Translator.prototype.getCodeFromIso = function ( iso ) {
	return this.constructor.static.codeFromIso[ iso ] || iso;
};

/**
 * Get the ISO code from the translator's language code
 *
 * @param {string} code Translator's language code
 * @return {string} ISO language code
 */
ll.Translator.prototype.getIsoFromCode = function ( code ) {
	var codeFromIso, isoFromCode;

	// Build the reverse mapping of codeFromIso and cache
	if ( !this.constructor.static.isoFromCode ) {
		this.constructor.static.isoFromCode = {};
		codeFromIso = this.constructor.static.codeFromIso;
		isoFromCode = this.constructor.static.isoFromCode;

		Object.keys( codeFromIso ).forEach( function ( iso ) {
			isoFromCode[ codeFromIso[ iso ] ] = iso;
		} );
	}
	return this.constructor.static.isoFromCode[ code ] || code;
};

/**
 * Translate plaintext
 *
 * @param {string} sourceLang Source language ISO code
 * @param {string} targetLang Target language ISO code
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
 * @param {string} sourceLang Source language ISO code
 * @param {string} targetLang Target language ISO code
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
