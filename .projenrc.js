const { awscdk } = require("projen");
const { Stability } = require("projen/lib/cdk/jsii-project");
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Florian Fuß",
  stability: Stability.EXPERIMENTAL,
  cdkVersion: "2.46.0",
  defaultReleaseBranch: "main",
  name: "cdk-internal-gateway",
  repositoryUrl: "https://github.com/pharindoko/cdk-internal-gateway.git",
  license: "Apache-2.0",
  description:
    "CDK construct to create to create internal serverless applications.",
  sampleCode: false,
  keywords: [
    "cdk",
    "apigateway",
    "internal",
    "private",
    "gateway",
    "vpc",
    "network",
    "api",
    "website",
    "application",
    "company",
    "enterprise",
  ],
  gitignore: ["cdk.out", "cdk.context.json", "/.idea", "status.json"],
  releaseToNpm: true,
  publishToPypi: {
    distName: "pharindoko.cdk-internal-gateway",
    module: "pharindoko.cdk_internal_gateway",
  },
  sampleCode: false,
  compat: true,
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ["auto-approve"],
      schedule: {
        cron: ["0 0 * * 1"],
      },
    },
  },
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: ["feat", "fix", "chore", "docs"],
      },
    },
  },
  pullRequestTemplate: false,
  prettier: true,
  jest: true,
  jestOptions: {
    updateSnapshot: false,
  },
});

// disable automatic releases, but keep workflow that can be triggered manually
const releaseWorkflow = project.github.tryFindWorkflow("release");
releaseWorkflow.file.addDeletionOverride("on.push");

project.synth();
