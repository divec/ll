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
 * Adapt corrections from old machine translation to new machine translation
 *
 * This has similarities of logic to ve.dm.Change.static.rebaseTransactions
 *
 * @param {ll.ChunkedText} oldMachineTranslation Machine-translated chunked old source
 * @param {ll.ChunkedText} newMachineTranslation Machine-translated chunked current source
 * @param {ll.ChunkedText} oldTarget Human-corrected version of oldMachineTranslation
 * @param {ll.Differ} differ Differ object
 * @param {ve.dm.HashValueStore} store The hash value store
 * @return {Object[]} Diff to use as candidate for human-corrected new machine translation
 * @return {Object} return.i The i'th item of the diff
 * @return {string} return.i.type RETAIN or REPLACE
 * @return {Array} [return.i.data] For retain, linear data retained
 * @return {boolean} [return.i.conflict] For replace, true if there is an adaptation conflict
 * @return {Array} [return.i.remove] For replace, linear data removed
 * @return {Array} [return.i.insert] For replace, linear data for insertion
 */
ll.adaptCorrections = function ( oldMachineTranslation, newMachineTranslation, oldTarget, differ ) {
	var diff3 = differ.diff3(
		newMachineTranslation.toLinearData(),
		oldMachineTranslation.toLinearData(),
		oldTarget.toLinearData()
	);

	return diff3.map( function ( triple ) {
		var m2 = triple[ 0 ],
			m1 = triple[ 1 ],
			t1 = triple[ 2 ];
		if ( m2 === null ) {
			return { type: 'RETAIN', data: t1 || m1 };
		} else if ( t1 === null ) {
			return { type: 'REPLACE', conflict: false, remove: m1, insert: m2 };
		} else {
			return { type: 'REPLACE', conflict: true, remove: t1, insert: m2 };
		}
	} );
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
 * Return a copy of data with an annotation added in the topmost position
 *
 * @param {string} hash The annotation hash
 * @param {Array} data The linear data
 * @return {Array} Annotated copy of the linear data
 */
ll.annotateData = function ( hash, data ) {
	return data.map( function ( item ) {
		if ( item.type ) {
			// Only annotate text
			return item;
		}
		if ( Array.isArray( item ) ) {
			return [ item[ 0 ], [ hash ].concat( item[ 1 ] ) ];
		}
		return [ item, [ hash ] ];
	} );
};
