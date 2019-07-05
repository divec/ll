/*!
 * LL two-way parallel translation - DataModel ConflictAnnotation class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Annotation to mark conflicting human-authored content in target text
 *
 * @class
 * @extends ve.ce.Annotation
 * @constructor
 * @param {ve.dm.LLConflictAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.LLConflictAnnotation = function VeCeLLConflictAnnotation() {
	// Parent constructor
	ve.ce.LLConflictAnnotation.super.apply( this, arguments );

	// DOM changes
	this.$element.addClass( 'll-conflict' );
};

/* Inheritance */

OO.inheritClass( ve.ce.LLConflictAnnotation, ve.ce.Annotation );

/* Static Properties */

ve.ce.LLConflictAnnotation.static.name = 'll/conflict';

ve.ce.LLConflictAnnotation.static.tagName = 'span';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.LLConflictAnnotation.static.getDescription = function () {
	return ve.msg( 'll-conflictannotation-description' );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LLConflictAnnotation );
