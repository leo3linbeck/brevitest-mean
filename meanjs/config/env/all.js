'use strict';

module.exports = {
	app: {
		title: 'Brevitest™',
		description: 'Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js',
		keywords: 'MongoDB, Express, AngularJS, Node.js'
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.css',
				'public/lib/angular-ui-notification/dist/angular-ui-notification.min.css',
				'public/lib/c3/c3.min.css',
				'public/lib/font-awesome/css/font-awesome.min.css',
                'public/lib/bootstrap-social/bootstrap-social.css',
                'public/lib/sweetalert/dist/sweetalert.css'
			],
			js: [
				'public/lib/angular/angular.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-cookies/angular-cookies.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-touch/angular-touch.js',
				'public/lib/angular-sanitize/angular-sanitize.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/angular-ui-notification/dist/angular-ui-notification.min.js',
				'public/lib/angular-socket-io/socket.min.js',
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/d3/d3.min.js',
				'public/lib/c3/c3.min.js',
				'public/lib/qrcode-generator/js/qrcode.js',
				'public/lib/qrcode-generator/js/qrcode_UTF8.js',
				'public/lib/angular-qrcode/qrcode.js',
				'public/lib/ng-csv/build/ng-csv.min.js',
				'public/lib/underscore/underscore-min.js',
                'public/lib/sweetalert/dist/sweetalert.min.js',
                'public/lib/angular-sweetalert/SweetAlert.js'
			]
		},
		css: [
			'public/modules/*/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js',
			'public/modules/superusers/services/unconfirmedUsers.client.service.js'
		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/*/tests/*.js'
		]
	}
};
