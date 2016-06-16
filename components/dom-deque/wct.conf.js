module.exports = {
  plugins: {
    local: {
      browsers: [
        'chrome'
        // 'firefox'
      ]
    },
    sauce: {
      disabled: true,
      browsers: [
        // {
        //   'browserName': 'safari',
        //   'platform': 'OS X 10.11',
        //   'version': '9.0'
        // },
        // {
        //   'browserName': 'safari',
        //   'platform': 'OS X 10.10',
        //   'version': '8.0'
        // },
        {
          'browserName': 'safari',
          'platform': 'OS X 10.9',
          'version': '7'
        }
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
