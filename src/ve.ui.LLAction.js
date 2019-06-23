/*!
 * LL two-way parallel translation actions
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLAction = function () {
	ve.ui.LLAction.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LLAction, ve.ui.Action );

/* Static properties */

ve.ui.LLAction.static.name = 'll';
ve.ui.LLAction.static.methods = [ 'clearDirty' ];

/* Static methods */

ve.ui.LLAction.prototype.clearDirty = function () {
	var selected, contentBranchNode,
		surface = this.surface.getModel(),
		fragment = surface.getFragment();

	if ( !( fragment.getSelection() instanceof ve.dm.LinearSelection ) ) {
		return;
	}
	selected = fragment.getLeafNodes();
	if ( selected.length !== 1 ) {
		return;
	}
	contentBranchNode = selected[ 0 ].node.isContent() ?
		selected[ 0 ].node.getParent() :
		selected[ 0 ].node;
	if ( !contentBranchNode.canContainContent() ) {
		return;
	}
	surface.markApproved( contentBranchNode );
};

/* Initialization */

ve.ui.actionFactory.register( ve.ui.LLAction );
