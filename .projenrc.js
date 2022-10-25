const { awscdk } = require('projen');
const { Stability } = require('projen/lib/cdk/jsii-project');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Florian Fuß',
  stability: Stability.EXPERIMENTAL,
  cdkVersion: '2.46.0', // 2.21.1 for lambda url, 2.29.0 for Names.uniqueResourceName()
  defaultReleaseBranch: 'main',
  name: 'cdk-internal-gateway',
  repositoryUrl: 'https://github.com/pharindoko/cdk-internal-gateway.git',
  license: 'Apache-2.0',
  description: 'CDK construct to create an internal gateway to ease the creation of internal websites, apis or applications',
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();