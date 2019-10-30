/*!
 * LL two-way parallel translation - DataModel ConflictAnnotation class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Annotation to mark human-added text that conflicts with updates.
 *
 * @class
 * @extends ve.dm.Annotation
 * @constructor
 * @param {Object} element
 */
ve.dm.LLConflictAnnotation = function VeDmLLConflictAnnotation() {
	// Parent constructor
	ve.dm.LLConflictAnnotation.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.LLConflictAnnotation, ve.dm.Annotation );

/* Static Properties */

ve.dm.LLConflictAnnotation.static.name = 'll/conflict';

ve.dm.LLConflictAnnotation.static.matchTagNames = [ 'span' ];

ve.dm.LLConflictAnnotation.static.matchFunction = function ( domElement ) {
	return domElement.classList.contains( 'll-conflict' );
};

ve.dm.LLConflictAnnotation.static.applyToAppendedContent = false;

ve.dm.LLConflictAnnotation.static.toDataElement = function ( domElements ) {
	// Embed chunk index in annotation
	var chunkIndex = domElements[ 0 ].getAttribute( 'data-chunkIndex' );
	return {
		type: this.name,
		attributes: {
			chunkIndex: parseInt( chunkIndex, 10 ) || 0
		}
	};
};

ve.dm.LLConflictAnnotation.static.toDomElements = function ( dataElement, doc ) {
	var domElement = doc.createElement( 'span' );
	domElement.classList.add( 'll-conflict' );
	domElement.setAttribute( 'data-chunkIndex', dataElement.attributes.chunkIndex );
	return [ domElement ];
};

/* Methods */

/**
 * @return {Object}
 */
ve.dm.LLConflictAnnotation.prototype.getComparableObject = function () {
	return {
		type: 'll/conflict',
		chunkIndex: this.getAttribute( 'chunkIndex' )
	};
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.LLConflictAnnotation );
