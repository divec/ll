/* global Renderer, Conversation, LogComponent, ComposerComponent */

window.AppComponent = class AppComponent extends Renderer.Component {
	constructor( props ) {
		super( props );

		this.conversation = new Conversation( this.props.lang );
		this.log = new LogComponent( {
			conversation: this.conversation,
			user: this.props.user,
			lang: this.props.lang
		} );
		this.composer = new ComposerComponent( {
			conversation: this.conversation,
			user: this.props.user,
			lang: this.props.lang
		} );
	}

	render() {
		return [ 'div.App.' + this.props.user,
			[ 'div.user', this.props.user ],
			this.log,
			this.composer
		];
	}
};
