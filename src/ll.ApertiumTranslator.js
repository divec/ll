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

/* Static methods */

/**
 * Bundle groups of strings for translation in one go
 *
 * @param {Array[]} groups Array of Arrays of strings
 * @return {string} The groups, joined with separators that break sentences
 */
ll.ApertiumTranslator.static.bundle = function ( groups ) {
	return groups.map( function ( group ) {
		return group.join( '\n:!!:\n' );
	} ).join( '\n:!!!:\n' );
};

/**
 * Unbundle groups of strings translated in one go
 *
 * @param {string} bundled Bundled groups, as returned by #bundle
 * @return {Array[]} Array of Arrays of strings
 */
ll.ApertiumTranslator.static.unbundle = function ( bundled ) {
	return bundled.split( /\s*:!!!:\s*/ ).map( function ( groupString ) {
		return groupString.split( /\s*:!!:\s*/ );
	} );
};

/* Instance methods */

/**
 * Translate plaintext
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @param {string} text The text to translate
 * @return {Promise} Promise resolving with the translated text
 */
ll.ApertiumTranslator.prototype.plaintextTranslate = function ( sourceLang, targetLang, text ) {
	var langPair,
		apertiumLangName = { en: 'eng', es: 'spa' },
		sourceApertiumLang = apertiumLangName[ sourceLang ],
		targetApertiumLang = apertiumLangName[ targetLang ];
	if ( !sourceApertiumLang ) {
		throw new Error( 'Unsupported language code "' + sourceApertiumLang );
	}
	if ( !targetApertiumLang ) {
		throw new Error( 'Unsupported language code "' + targetApertiumLang );
	}
	langPair = sourceApertiumLang + '|' + targetApertiumLang;
	return $.ajax( {
		url: this.url,
		datatype: 'json',
		data: {
			markUnknown: 'no',
			langpair: langPair,
			q: text
		}
	} ).then( function ( data ) {
		return data.responseData.translatedText;
	} );
};

/**
 * @inheritdoc
 */
ll.ApertiumTranslator.prototype.translate = function ( sourceLang, targetLang, sourceTexts ) {
	var plexSourceGroups,
		apertiumTranslator = this;

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

	return this.plaintextTranslate(
		sourceLang,
		targetLang,
		this.constructor.static.bundle( plexSourceGroups )
	).then( function ( modifiedTargetsBundle ) {
		var modifiedTargetsList = apertiumTranslator.constructor.static.unbundle( modifiedTargetsBundle );
		return modifiedTargetsList.map( function ( modifiedTargets, i ) {
			var targetPlainText = modifiedTargets.pop();
			return ll.adaptAnnotationsWithModifiedTargets( sourceTexts[ i ], targetPlainText, modifiedTargets );
		} );
	} );
};
