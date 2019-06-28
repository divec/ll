/*!
 * LL two-way parallel translation - initialization target
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

ll.init.LLTarget = function () {
	ll.init.LLTarget.super.apply( this, arguments );
};

OO.inheritClass( ll.init.LLTarget, ve.init.sa.Target );

ll.init.LLTarget.static.toolbarGroups = ve.copy( ll.init.LLTarget.static.toolbarGroups );
ll.init.LLTarget.static.toolbarGroups.push( {
	name: 'll',
	include: [ { group: 'll' } ]
} );
