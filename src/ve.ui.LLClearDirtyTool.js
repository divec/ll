/*!
 * LL two-way parallel translation ClearDirty tool
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * @class
 *
 * @constructor
 */
ve.ui.LLClearDirtyTool = function () {
	// Parent constructor
	ve.ui.LLClearDirtyTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LLClearDirtyTool, ve.ui.Tool );

/* Static properties */

ve.ui.LLClearDirtyTool.static.name = 'clearDirty';
ve.ui.LLClearDirtyTool.static.group = 'll';
ve.ui.LLClearDirtyTool.static.icon = 'check';
ve.ui.LLClearDirtyTool.static.title = 'Approve translation';
ve.ui.LLClearDirtyTool.static.autoAddToCatchall = false;
ve.ui.LLClearDirtyTool.static.commandName = 'clearDirty';

/* Initialization */

ve.ui.toolFactory.register( ve.ui.LLClearDirtyTool );
