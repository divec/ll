/*!
 * LL two-way parallel translation - DataModel UpdateAnnotation class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Annotation to mark automatically updated content in target text
 *
 * @class
 * @extends ve.ce.Annotation
 * @constructor
 * @param {ve.dm.LLUpdateAnnotation} model Model to observe
 * @param {ve.ce.ContentBranchNode} [parentNode] Node rendering this annotation
 * @param {Object} [config] Configuration options
 */
ve.ce.LLUpdateAnnotation = function VeCeLLUpdateAnnotation() {
	// Parent constructor
	ve.ce.LLUpdateAnnotation.super.apply( this, arguments );

	// DOM changes
	this.$element.addClass( 'll-update' );
};

/* Inheritance */

OO.inheritClass( ve.ce.LLUpdateAnnotation, ve.ce.Annotation );

/* Static Properties */

ve.ce.LLUpdateAnnotation.static.name = 'll/update';

ve.ce.LLUpdateAnnotation.static.tagName = 'span';

/* Static Methods */

/**
 * @inheritdoc
 */
ve.ce.LLUpdateAnnotation.static.getDescription = function () {
	return ve.msg( 'll-updateannotation-description' );
};

/* Registration */

ve.ce.annotationFactory.register( ve.ce.LLUpdateAnnotation );
