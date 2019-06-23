/*!
 * LL two-way parallel translation ClearDirty command
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLClearDirtyCommand = function () {
	ve.ui.LLClearDirtyCommand.super.call(
		this, 'clearDirty', 'll', 'clearDirty',
		{ supportedSelections: [ 'linear' ] }
	);
};

/* Inheritance */

OO.inheritClass( ve.ui.LLClearDirtyCommand, ve.ui.Command );

/* Static methods */

ve.ui.LLClearDirtyCommand.prototype.isExecutable = function ( fragment ) {
	var selected, contentBranch;
	if ( !ve.ui.LLClearDirtyCommand.super.prototype.isExecutable.apply( this, arguments ) ) {
		return false;
	}
	if ( !( fragment.getSelection() instanceof ve.dm.LinearSelection ) ) {
		return false;
	}
	selected = fragment.getLeafNodes();
	if ( selected.length !== 1 ) {
		return false;
	}
	contentBranch = selected[ 0 ].node.isContent() ?
		selected[ 0 ].node.getParent() :
		selected[ 0 ].node;
	return contentBranch.canContainContent() &&
		( contentBranch.getAttribute( 'll-dirty' ) === 'edited' ||
		contentBranch.getAttribute( 'll-dirty' ) === 'mt' );
};

/* Initialization */

ve.ui.commandRegistry.register( new ve.ui.LLClearDirtyCommand() );
