module.exports = function(error) {
  if (error.message) {
    console.error('\nMessage: ' + error.message)
  }

  if (error.stack) {
    console.log('\nStacktrace:')
    console.log('====================')
    console.log(error.stack);
  }
}