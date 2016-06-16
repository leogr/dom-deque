module.exports = {
  plugins: {
    local: {
      browsers: [
        'chrome'
      ]
    },
    istanbul: {
      dir: './coverage',
      reporters: [
        'text-summary',
        'lcov',
        'html'
      ],
      include: [
        '/dom-deque.html',
        '/dom-deque-behavior.html',
        '/templatizer.html'
      ],
      exclude: [
      ]
    }
  }
}
