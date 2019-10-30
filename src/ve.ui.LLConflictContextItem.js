/*!
 * LL LLConflictContextItem class.
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Context item for a conflict.
 *
 * @class
 * @extends ve.ui.AnnotationContextItem
 *
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.LLConflictContextItem = function VeUiLLConflictContextItem( context, model, config ) {
	// Parent constructor
	ve.ui.LLConflictContextItem.super.call( this, context, model, config );

	// Initialization
	this.clearButton
		.setIcon( 'check' )
		.clearFlags()
		.setFlags( [ 'progressive' ] );
	this.$element.addClass( 've-ui-languageContextItem' );
};

/* Inheritance */

OO.inheritClass( ve.ui.LLConflictContextItem, ve.ui.AnnotationContextItem );

/* Static properties */

ve.ui.LLConflictContextItem.static.name = 'conflict';

ve.ui.LLConflictContextItem.static.icon = 'speechBubbles';

ve.ui.LLConflictContextItem.static.label = OO.ui.deferMsg( 'll-conflictcontextitem-title' );

ve.ui.LLConflictContextItem.static.modelClasses = [ ve.dm.LLConflictAnnotation ];

ve.ui.LLConflictContextItem.static.embeddable = false;

ve.ui.LLConflictContextItem.static.editable = false;

ve.ui.LLConflictContextItem.static.commandName = null;

ve.ui.LLConflictContextItem.static.clearMsg = OO.ui.deferMsg( 'll-conflictcontextitem-remove' );

/* Static methods */

/**
 * Chunk of up to three different versions of content branch node linear data.
 *
 * @typedef {Array} Diff3Chunk
 * @property {Array|null} 0 New machine translation, null if the translation is the same as "old"
 * @property {Array} 1 Old machine translation, never null
 * @property {Array|null} 2 Human correction, null if the user has not manually corrected the chunk
 */

/**
 * Create an HTML rendering of the diff3 of the content branch node, highlighting the active chunk.
 *
 * @param {number} activeChunkIndex Index of the active chunk within the diff3
 * @param {Diff3Chunk[]} diff3 List of diff3 chunks
 * @return {string} HTML rendering
 */
ve.ui.LLConflictContextItem.static.renderDiff = function ( activeChunkIndex, diff3 ) {
	var i, iLen, chunk, oldMt, correction, newMt,
		$escaper = $( '<div>' ),
		oldMtList = [],
		correctionList = [],
		newMtList = [];

	/**
	 * Escape special HTML text node characters.
	 *
	 * @param {string} text Text to escape
	 * @return {string} Escaped text
	 */
	function esc( text ) {
		return $escaper.text( text ).html();
	}

	/**
	 * Strip annotations from content.
	 *
	 * Replace elements with • (unicode bullet symbol)
	 *
	 * @param {Array} data Linear content data
	 * @return {string} Plain text form of content
	 */
	function flatten( data ) {
		return data.map( function ( item ) {
			if ( Array.isArray( item ) ) {
				// It's an annotated character
				return item[ 0 ];
			}
			if ( !item.type ) {
				// It's a plain character
				return item;
			}
			if ( item.type[ 0 ] !== '/' ) {
				// It's an opening element
				return '•';
			}
			// It's a closing element
			return '';
		} ).join( '' );
	}

	for ( i = 0, iLen = diff3.length; i < iLen; i++ ) {
		chunk = diff3[ i ];

		// oldMt: old machine translation
		oldMt = chunk[ 1 ];
		// correction: human correction, if present, same as oldMt otherwise
		correction = chunk[ 2 ] || oldMt;
		// newMt: new translation, if present, same as correction otherwise
		newMt = chunk[ 0 ] || correction;

		// Transform chunks into annotation-stripped content strings
		oldMt = flatten( oldMt );
		correction = flatten( correction );
		newMt = flatten( newMt );

		// Build list of html strings

		// Start wrapping active chunks in ll-active spans
		if ( i === activeChunkIndex ) {
			oldMtList.push( '<span class="ll-active">' );
			correctionList.push( '<span class="ll-active">' );
			newMtList.push( '<span class="ll-active">' );
		}

		// Old has no special wrapping
		oldMtList.push( esc( oldMt ) );

		// Start wrapping correction list chunk if it differs from old
		if ( correction !== oldMt ) {
			correctionList.push( '<span class="ll-change">' );
		}
		correctionList.push( esc( correction ) );
		// Finsh wrapping newMt list chunk if it differs from correction
		if ( correction !== oldMt ) {
			correctionList.push( '</span>' );
		}

		// Start wrapping newMt list chunk if it differs from correction
		if ( newMt !== correction ) {
			newMtList.push( '<span class="ll-merge">' );
		}
		newMtList.push( esc( newMt ) );
		// Finsh wrapping newMt list chunk if it differs from correction
		if ( newMt !== correction ) {
			newMtList.push( '</span>' );
		}

		// Finsh wrapping active chunks in ll-active spans
		if ( i === activeChunkIndex ) {
			oldMtList.push( '</span>' );
			correctionList.push( '</span>' );
			newMtList.push( '</span>' );
		}
	}

	return (
		'<div class="ll-label">' +
			'<small>' +
				OO.ui.msg( 'll-conflictcontextitem-oldmt' ) +
			'</small>' +
		'</div>' +
		'<div class="ll-sample ll-oldmt">' +
			oldMtList.join( '' ) +
		'</div>' +
		'<div class="ll-label">' +
			'<small>' +
				OO.ui.msg( 'll-conflictcontextitem-correction' ) +
			'</small>' +
		'</div>' +
		'<div class="ll-sample ll-correction">' +
			correctionList.join( '' ) +
		'</div>' +
		'<div class="ll-label">' +
			'<small>' +
				OO.ui.msg( 'll-conflictcontextitem-newmt' ) +
			'</small>' +
		'</div>' +
		'<div class="ll-sample ll-newmt">' +
			newMtList.join( '' ) +
		'</div>'
	);
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.LLConflictContextItem.prototype.renderBody = function () {
	var diff3, chunkIndex, html;

	/**
	 * Extract the diff3 attribute from the content branch node that contains the current context.
	 *
	 * @param {ve.ui.Context} context Context which is aparently useless since it has no information
	 *   about the actual context - I mean, seriously?
	 * @return {Array} Diff3 information
	 * @throws {Error} If selection is still compatible with the context item (must be linear)
	 * @throws {Error} If selection lies inside a content branch node
	 */
	function getContentBranchNodeDiff3( context ) {
		var surfaceModel, sel, focus, node;
		// HACK: get the content branch node from the context's current surface selection, ideally
		// we wouldn't have to chase down the selection but we don't have enough information in
		// this method
		surfaceModel = context.getSurface().getModel();
		sel = surfaceModel.getSelection();
		// Check if selection is still compatible with the context item (must be linear)
		if ( !( sel instanceof ve.dm.LinearSelection ) ) {
			throw new Error( 'LLConflictContextItem but not LinearSelection' );
		}
		focus = sel.getRange().to;
		node = surfaceModel.getDocument().getDocumentNode().getNodeFromOffset( focus );
		while ( node && !node.canContainContent() ) {
			node = node.parent;
		}
		// Check if selection lies inside a content branch node
		if ( !node ) {
			throw new Error( 'ConflictContextItem not in ContentBranchNode' );
		}
		// Return the diff3
		return node.getAttribute( 'll-diff3' );
	}
	// Get diff3 from content branch node
	diff3 = getContentBranchNodeDiff3( this.context );
	// Get chunk index from conflict annotation
	chunkIndex = this.model.getAttribute( 'chunk' );
	// Generate an HTML rendering of the diff3, highlighting the active chunk
	html = ve.ui.LLConflictContextItem.static.renderDiff( chunkIndex, diff3 );
	this.$body.html( html );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.LLConflictContextItem );
