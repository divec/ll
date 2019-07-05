/*!
 * LL two-way parallel translation - DataModel UpdateAnnotation class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Annotation to mark automatically updated content in target text
 *
 * @class
 * @extends ve.dm.Annotation
 * @constructor
 * @param {Object} element
 */
ve.dm.LLUpdateAnnotation = function VeDmLLUpdateAnnotation() {
	// Parent constructor
	ve.dm.LLUpdateAnnotation.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.LLUpdateAnnotation, ve.dm.Annotation );

/* Static Properties */

ve.dm.LLUpdateAnnotation.static.name = 'll/update';

ve.dm.LLUpdateAnnotation.static.matchTagNames = [ 'span' ];

ve.dm.LLUpdateAnnotation.static.matchFunction = function ( domElement ) {
	return domElement.classList.contains( 'll-update' );
};

ve.dm.LLUpdateAnnotation.static.applyToAppendedContent = false;

ve.dm.LLUpdateAnnotation.static.toDataElement = function () {
	// XXX include extra info to display
	return { type: this.name };
};

ve.dm.LLUpdateAnnotation.static.toDomElements = function ( dataElement, doc ) {
	var domElement = doc.createElement( 'span' );
	domElement.classList.add( 'll-update' );
	return [ domElement ];
};

/* Methods */

/**
 * @return {Object}
 */
ve.dm.LLUpdateAnnotation.prototype.getComparableObject = function () {
	return { type: 'll/update' };
};

/* Registration */

ve.dm.modelRegistry.register( ve.dm.LLUpdateAnnotation );
