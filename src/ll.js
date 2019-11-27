/*!
 * LL two-way parallel translation - LL namespace
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/*!
 * LL namespace
 */

ll = {
	init: {}
};

/**
 * Break text into wordbreak-separated tokens, with whitespace normalized
 *
 * If the text already had normalized whitespace, getTokens( text ).join( '' ) === text
 *
 * @param {string} text The text to tokenize
 * @return {string} The text split by wordbreaks, with whitespace normalized
 */
ll.getTokens = function ( text ) {
	var thisBreak, us,
		prevBreak = 0,
		tokens = [];

	text = text.replace( /^\s+|\s+$/g, '' ).replace( /\s+/g, ' ' );
	us = new unicodeJS.TextString( text );
	while ( true ) {
		thisBreak = unicodeJS.wordbreak.nextBreakOffset( us, prevBreak );
		if ( thisBreak === prevBreak ) {
			break;
		}
		tokens.push( text.slice( prevBreak, thisBreak ) );
		prevBreak = thisBreak;
	}
	return tokens;
};

/**
 * Find changed tokens in a list of modified modifiedTexts
 *
 * Build annotated target from annotated source, plaintext target, and chunk offsets
 *
 * This is designed so a plaintext translation engine can be used to translate annotated text.
 * Certain chunk offsets can be missing; the corresponding annotations will be dropped.
 *
 * For example, suppose we have annotated source "<b>It</b> is a big <i>red</i> <a ...>Box</a>".
 * We can translate the following strings:
 * [
 *     'It is a big red Box',
 *     'IT is a big red Box',
 *     'It is a big RED Box',
 *     'It is a big red BOX'
 * ]
 * Suppose the translations look like this:
 * [
 *     'Es una gran Caja roja',
 *     'Es una gran Caja roja',
 *     'Es una gran Caja ROJA',
 *     'Es una gran CAJA roja'
 * ]
 *
 * Then we can say:
 * - the source chunk 'It' maps to an unknown range
 * - the source chunk 'red' maps to target.slice(17, 21) (=roja)
 * - the source chunk 'Box' maps to target.slice(12, 16) (=Caja)
 *
 * From this we can generate annotated target "Es una gran <a ...>Caja</a> <i>roja</i>".
 *
 * This tends to work well because chunks are still translated in context (whereas, say,
 * 'red' out of context might be translated as 'rojo' not 'roja').
 *
 * @param {ll.ChunkedText} chunkedSource Source as annotated chunked content
 * @param {string} target The target as plaintext
 * @param {string[]} modifiedTargets Copies of the target, each with one chunk modified
 *
 * @param {Array} The target offsets corresponding to each source chunk (undefined if not found)
 * @param {Object} [return.i] The target offsets for the i'th source chunk
 * @param {number} [return.i.start] The start target offset for the i'th chunk
 * @param {number} [return.i.end] The end target offset for the i'th chunk
 *
 * @return {ll.ChunkedText} Target as annotated chunked content
 */
ll.adaptAnnotationsWithModifiedTargets = function ( chunkedSource, target, modifiedTargets ) {
	var i, iLen, modifiedTokens, edgeMatches, start, text,
		chunks = [],
		tokens = ll.getTokens( target ),
		modifiedTokensList = modifiedTargets.map( ll.getTokens );

	for ( i = 0, iLen = modifiedTokensList.length; i < iLen; i++ ) {
		modifiedTokens = modifiedTokensList[ i ];
		edgeMatches = ve.countEdgeMatches( tokens, modifiedTokens );
		if ( !edgeMatches ) {
			// Unchanged: target not found
			continue;
		}
		// Translate start offset from tokens to characters
		start = tokens.slice( 0, edgeMatches.start ).join( '' ).length;
		text = tokens.slice(
			edgeMatches.start,
			tokens.length - edgeMatches.end
		).join( '' );
		chunks.push( {
			start: start,
			text: text,
			annList: chunkedSource.chunks[ i ].annList
		} );
	}
	// Sort in start order
	chunks.sort( function ( a, b ) {
		return a.start - b.start;
	} );
	return new ll.ChunkedText(
		target,
		chunkedSource.commonAnnList,
		chunks
	);
};

/**
 * Make a postponed call.
 *
 * Use this instead of setTimeout, for easier replacement when testing.
 *
 * @param {Function} callback The function to call back
 * @param {number} [ms] Minimum time to wait in milliseconds (default 0)
 * @param {number} Unique id for the postponement, used by #clearTimeout
 */
ll.setTimeout = setTimeout.bind( null );

/**
 * Cancel a postponed call.
 *
 * Use this instead of clearTimeout, for easier replacement when testing.
 *
 * @param {number} id Unique id for the postponement, returned by #setTimeout
 */
ll.clearTimeout = clearTimeout.bind( null );

/**
 * Modify linear data in-place by adding annotation in the topmost position
 *
 * @param {string} hash The annotation hash
 * @param {Array} data The linear data to modify in-place
 * @param {number} start The start of the region to annotate
 * @param {number} end The end of the region to annotate
 */
ll.annotateDataInPlace = function ( hash, data, start, end ) {
	var i, item;
	for ( i = start; i < end; i++ ) {
		item = data[ i ];
		if ( item.type ) {
			if ( item.type[ 0 ] === '/' ) {
				continue;
			}
			item.annotations = [ hash ].concat( item.annotations || [] );
		} else if ( Array.isArray( item ) ) {
			data[ i ] = [ item[ 0 ], [ hash ].concat( item[ 1 ] ) ];
		} else {
			data[ i ] = [ item, [ hash ] ];
		}
	}
};

/**
 * Return a copy of data with an annotation added in the topmost position
 *
 * @param {string} hash The annotation hash
 * @param {Array} data The linear data
 * @return {Array} Annotated copy of the linear data
 */
ll.annotateData = function ( hash, data ) {
	data = data.slice();
	ll.annotateDataInPlace( hash, data, 0, data.length );
	return data;
};

/**
 * Modify linear data in-place: remove topmost found annotation, where present
 *
 * @param {string} hash The annotation hash
 * @param {Array} data The linear data to modify in-place
 * @param {number} start The start of the region to annotate
 * @param {number} end The end of the region to annotate
 * @return {boolean} True if any changes were made
 */
ll.unannotateDataInPlace = function ( hash, data, start, end ) {
	var i, item, ch, annList, index,
		changed = false;
	for ( i = start; i < end; i++ ) {
		item = data[ i ];
		if ( item.type ) {
			if ( item.type[ 0 ] === '/' ) {
				continue;
			}
			annList = item.annotations;
			index = annList && annList.lastIndexOf( hash );
			if ( !annList || index === -1 ) {
				continue;
			}
			annList = annList.slice();
			annList.splice( index, 1 );
			if ( annList.length === 0 ) {
				delete item.annotations;
			} else {
				item.annotations = annList;
			}
			continue;
		}
		if ( !Array.isArray( item ) ) {
			continue;
		}
		ch = item[ 0 ];
		annList = item[ 1 ];
		index = annList.lastIndexOf( hash );
		if ( index === -1 ) {
			continue;
		}
		changed = true;
		annList = annList.slice();
		annList.splice( index, 1 );
		if ( annList.length === 0 ) {
			data[ i ] = ch;
		} else {
			data[ i ] = [ ch, annList ];
		}
	}
	return changed;
};
