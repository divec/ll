/*!
 * LL two-way parallel translation - ve.dm extensions
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Get the tree path of a position in the document
 *
 * @param {Object} position Position in the document
 * @param {ve.dm.BranchNode} position.node Branch node in which the position lies
 * @param {number} [position.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @param {number} [position.treeOffset] If node is not a ContentBranchNode, offset in its children list
 * @return {number[]} Tree path, linearized inside ContentBranchNode if there is one
 */
ve.dm.getTreePathFromPosition = function ( position ) {
	var path = position.node.getOffsetPath();
	path.push( position.treeOffset !== undefined ? position.treeOffset : position.linearOffset );
	return path;
};

/**
 * Get the linear offset of a position in the document
 *
 * @param {Object} position Position in the document
 * @param {ve.dm.BranchNode} position.node Branch node in which the position lies
 * @param {number} [position.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @param {number} [position.treeOffset] If node is not a ContentBranchNode, offset in its children list
 * @return {number} Linear offset
 */
ve.dm.getOffsetFromPosition = function ( position ) {
	var children;
	if ( position.linearOffset !== undefined ) {
		return position.node.getRange().start + position.linearOffset;
	}
	children = position.node.getChildren();
	if ( position.treeOffset === children.length ) {
		return position.node.getRange().end;
	}
	return position.node.getChildren()[ position.treeOffset ].getOuterRange().start;
};
