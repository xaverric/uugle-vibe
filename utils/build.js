// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

var webpack = require('webpack'),
  config = require('../webpack.config');

config.mode = 'production';

webpack(config, function (err, stats) {
  if (err) {
    console.error('Build failed with error:', err);
    throw err;
  }
  
  if (stats.hasErrors()) {
    console.error('Build failed with compile errors:', stats.toJson().errors);
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
});
