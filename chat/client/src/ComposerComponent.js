/* global Renderer */

window.ComposerComponent = class ComposerComponent extends Renderer.Component {
	render() {
		return [ 'div.Composer',
			[ 'form', { onsubmit: 'onSubmit' },
				[ 'input', { type: 'text' } ]
			]
		];
	}

	onSubmit( e ) {
		e.preventDefault();
		const input = e.target.getElementsByTagName( 'input' )[ 0 ];
		if ( input.value ) {
			this.props.conversation.send( {
				sender: this.props.user,
				lang: this.props.lang,
				text: input.value
			} );
			input.value = '';
		}
		return false;
	}
};
