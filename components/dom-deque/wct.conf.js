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
        {
          'browserName': 'microsoftedge',
          'platform': 'Windows 10',
          'version': ''
        }
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

        // {
        //   'browserName': 'safari',
        //   'platform': 'OS X 10.9',
        //   'version': 'latest'
        // }
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
