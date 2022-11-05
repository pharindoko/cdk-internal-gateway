const { awscdk } = require('projen');
const { Stability } = require('projen/lib/cdk/jsii-project');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Florian Fuß',
  stability: Stability.EXPERIMENTAL,
  cdkVersion: '2.46.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-internal-gateway',
  repositoryUrl: 'https://github.com/pharindoko/cdk-internal-gateway.git',
  license: 'Apache-2.0',
  description: 'CDK construct to create an internal aws api-gateway to ease the creation of internal websites, apis or applications',
  sampleCode: false,
  keywords: ['cdk', 'apigateway', 'internal', 'gateway', 'vpc', 'network', 'api', 'website', 'application'],
  gitignore: [
    'cdk.out',
    'cdk.context.json',
    '/.idea',
    'status.json',
  ],
  sampleCode: false,
  compat: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
      schedule: {
        cron: ['0 0 * * 1'],
      },
    },
  },
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: [
          'feat',
          'fix',
          'chore',
          'docs',
        ],
      },
    },
  },
  pullRequestTemplate: false,
});


// disable automatic releases, but keep workflow that can be triggered manually
const releaseWorkflow = project.github.tryFindWorkflow('release');
releaseWorkflow.file.addDeletionOverride('on.push');

project.synth();