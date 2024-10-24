module.exports = {
    parserPreset: {
      parserOpts: {
        headerPattern: /^(\[[A-Za-z]+\])\s(.+)$/,
        headerCorrespondence: ['label', 'title'],
      },
    },
    rules: {
      'header-match-team-pattern': [2, 'always'],
      'header-max-length': [2, 'always', 72],
      'body-leading-blank': [2, 'always'],
      'footer-leading-blank': [2, 'always'],
      'label-empty': [2, 'never'],
      'title-empty': [2, 'never'],
      'label-case': [2, 'always', 'pascal-case'],
    },
    plugins: [
      {
        rules: {
          'header-match-team-pattern': ({header}) => {
            const pattern = /^\[[A-Za-z]+\]\s.+/;
            return [
              pattern.test(header),
              'Header does not match "<[Label]> Title" pattern',
            ];
          },
          'label-empty': ({label}) => [
            !!label,
            'Label must not be empty',
          ],
          'title-empty': ({title}) => [
            !!title,
            'Title must not be empty',
          ],
        },
      },
    ],
  };
  