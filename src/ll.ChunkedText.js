/*!
 * LL two-way parallel translation - Prism class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Parallel document models with identical structure but differing content
 *
 * Parameters are passed by reference
 *
 * @class
 * @constructor
 * @param {string} allText The entire text as plaintext
 * @param {string[]} commonAnnList List of annotation hashes applying to the entire content
 * @param {Object[]} chunks Chunks of text ranges with a different annotation list
 * @param {Object} chunks.i The i'th chunk
 * @param {number} chunks.i.start The chunk's start offset
 * @param {string} chunks.i.text The chunk's text
 * @param {string[]} chunks.i.annList List of annotation hashes applying to the chunk
 */
ll.ChunkedText = function LLChunkedText( allText, commonAnnList, chunks ) {
	this.allText = allText;
	this.commonAnnList = commonAnnList;
	this.chunks = chunks;
};

/* Initialize */

OO.initClass( ll.ChunkedText );

/* Instance methods */

ll.ChunkedText.prototype.toJSON = function () {
	return {
		allText: this.getAllText(),
		commonAnnList: this.getCommonAnnList(),
		chunks: this.getChunks()
	};
};

/**
 * @return {string} text The entire text as plaintext
 */
ll.ChunkedText.prototype.getAllText = function () {
	return this.allText;
};

/**
 * @return {string[]} commonAnnList List of annotation hashes applying to the entire content
 */
ll.ChunkedText.prototype.getCommonAnnList = function () {
	return this.commonAnnList;
};

/**
 * @return {Object[]} Chunks of text ranges with a different annotation list
 * @return {Object} return.i The i'th chunk
 * @return {number} return.i.start The chunk's start offset
 * @return {string} return.i.text The chunk's text
 * @return {string[]} return.i.annList List of annotation hashes applying to the chunk
 */
ll.ChunkedText.prototype.getChunks = function () {
	return this.chunks;
};

/**
 * Return a slice of the chunked text
 *
 * @param {number} start The start offset (< 0 counts from end of string)
 * @param {number} [end] The end offset (defaults to end of string)
 * @return {ll.ChunkedText} The slice
 */
ll.ChunkedText.prototype.slice = function ( start, end ) {
	var allText, chunks, i, iLen, chunk;
	if ( start === undefined ) {
		start = 0;
	}
	if ( end === undefined ) {
		end = this.allText.length;
	}
	if ( start < 0 ) {
		start += this.allText.length;
	}
	if ( end < 0 ) {
		end += this.allText.length;
	}
	allText = this.allText.slice( start, end );
	chunks = [];
	for ( i = 0, iLen = this.chunks.length; i < iLen; i++ ) {
		chunk = this.chunks[ i ];
		if ( chunk.start >= end || chunk.start + chunk.text.length < start ) {
			continue;
		}
		chunks.push( {
			start: chunk.start - start,
			text: chunk.text.slice(
				0,
				Math.min( chunk.text.length, allText.length - start )
			),
			annList: chunk.annList
		} );
	}
	return new ll.ChunkedText( allText, this.commonAnnList.slice(), chunks );
};

/**
 * Get content as linear data
 *
 * @return {Array} The content as linear data
 */
ll.ChunkedText.prototype.toLinearData = function () {
	var i, iLen, chunk,
		allText = this.allText,
		commonAnnList = this.commonAnnList,
		cursor = 0,
		data = [];

	function annotate( text, annList ) {
		var j, jLen,
			plainData = text.split( '' );
		if ( annList.length === 0 ) {
			return plainData;
		}
		for ( j = 0, jLen = plainData.length; j < jLen; j++ ) {
			plainData[ j ] = [ plainData[ j ], ve.copy( annList ) ];
		}
		return plainData;
	}

	for ( i = 0, iLen = this.chunks.length; i < iLen; i++ ) {
		chunk = this.chunks[ i ];
		ve.batchPush(
			data,
			annotate( allText.slice( cursor, chunk.start ), commonAnnList )
		);
		ve.batchPush(
			data,
			annotate( chunk.text, chunk.annList )
		);
		cursor = chunk.start + chunk.text.length;
	}
	ve.batchPush(
		data,
		annotate( allText.slice( cursor ), commonAnnList )
	);
	return data;
};
