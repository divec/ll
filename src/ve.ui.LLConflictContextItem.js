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

	this.clearButton.setIcon( 'check' ).clearFlags().setFlags( [ 'progressive' ] );

	// Initialization
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

ve.ui.LLConflictContextItem.static.renderDiff = function ( activeChunk, diff3 ) {
	var i, iLen, chunk, oldMt, correction, newMt, html,
		$escaper = $( '<div>' ),
		oldMtList = [],
		correctionList = [],
		newMtList = [];

	function esc( text ) {
		return $escaper.text( text ).html();
	}

	function flatten( data ) {
		return data.map( function ( item ) {
			if ( Array.isArray( item ) ) {
				return item[ 0 ];
			}
			if ( !item.type ) {
				return item;
			}
			if ( item.type[ 0 ] !== '/' ) {
				// bullet
				return '\u2022';
			}
		} ).join( '' );
	}

	for ( i = 0, iLen = diff3.length; i < iLen; i++ ) {
		chunk = diff3[ i ];
		oldMt = flatten( chunk[ 1 ] );
		correction = flatten( chunk[ 2 ] || chunk[ 1 ] );
		newMt = flatten( chunk[ 0 ] || chunk[ 2 ] || chunk[ 1 ] );

		if ( i === activeChunk ) {
			oldMtList.push( '<span class="ll-active">' );
			correctionList.push( '<span class="ll-active">' );
			newMtList.push( '<span class="ll-active">' );
		}

		oldMtList.push( esc( oldMt ) );

		if ( correction !== oldMt ) {
			correctionList.push( '<span class="ll-change">' );
		}
		correctionList.push( esc( correction ) );
		if ( correction !== oldMt ) {
			correctionList.push( '</span>' );
		}

		if ( newMt !== correction ) {
			newMtList.push( '<span class="ll-merge">' );
		}
		newMtList.push( esc( newMt ) );
		if ( newMt !== correction ) {
			newMtList.push( '</span>' );
		}

		if ( i === activeChunk ) {
			oldMtList.push( '</span>' );
			correctionList.push( '</span>' );
			newMtList.push( '</span>' );
		}
	}
	html = '';
	html += '<div><small>' + OO.ui.msg( 'll-conflictcontextitem-oldmt' ) + '</small></div>\n';
	html += '<div>' + oldMtList.join( '' ) + '</div>\n';
	html += '<div><small>' + OO.ui.msg( 'll-conflictcontextitem-correction' ) + '</small></div>\n';
	html += '<div>' + correctionList.join( '' ) + '</div>\n';
	html += '<div><small>' + OO.ui.msg( 'll-conflictcontextitem-newmt' ) + '</small></div>\n';
	html += '<div>' + newMtList.join( '' ) + '</div>\n';
	return html;
};

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.LLConflictContextItem.prototype.renderBody = function () {
	var diff3, chunk, html;

	function getContentBranchNodeDiff3( context ) {
		var surface, sel, focus, node;
		// HACK: get the content branch node from the context's current surface selection
		surface = context.getSurface().getModel();
		sel = surface.getSelection();
		if ( !( sel instanceof ve.dm.LinearSelection ) ) {
			throw new Error( 'LLConflictContextItem but not LinearSelection' );
		}
		focus = sel.getRange().to;
		node = surface.getDocument().getDocumentNode().getNodeFromOffset( focus );
		while ( node && !node.canContainContent() ) {
			node = node.parent;
		}
		if ( !node ) {
			throw new Error( 'ConflictContextItem not in ContentBranchNode' );
		}
		// Return the diff3
		return node.getAttribute( 'll-diff3' );
	}
	diff3 = getContentBranchNodeDiff3( this.context );
	chunk = this.model.getAttribute( 'chunk' );
	html = ve.ui.LLConflictContextItem.static.renderDiff( chunk, diff3 );
	this.$body.html( html );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.LLConflictContextItem );
