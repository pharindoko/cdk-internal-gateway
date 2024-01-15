import {
  App,
  Aspects,
  Stack,
  aws_ec2 as ec2,
  aws_route53 as route53,
} from "aws-cdk-lib";
import { Annotations, Match } from "aws-cdk-lib/assertions";
// eslint-disable-next-line import/no-extraneous-dependencies
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import { InternalService } from "../src";

describe("cdk-nag AwsSolutions Pack", () => {
  let stack: Stack;
  let app: App;

  beforeEach(() => {
    // GIVEN
    app = new App();
    const env = {
      account: "123456789012",
      region: "us-east-1",
    };
    stack = new Stack(app, "test", {
      env,
    });
    const vpc = new ec2.Vpc(stack, "vpc", {
      maxAzs: 3,
    });

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      stack,
      "hosted-zone",
      {
        hostedZoneId: "hosted-zone-id",
        zoneName: "test.example.io",
      }
    );

    let vpcPublicSubnets = {
      subnets: ["subnet-123", "subnet-124"].map((ip, index) =>
        ec2.Subnet.fromSubnetId(stack, `publicSubnet${index}`, ip)
      ),
    };

    new InternalService(stack, "internal-service", {
      subnetSelection: vpcPublicSubnets,
      subDomain: "vt-runner",
      vpcEndpointIPAddresses: ["192.168.2.1", "192.168.2.2"],
      subjectAlternativeNames: ["test.example.io"],
      hostedZone,
      vpc,
    });

    Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
  });

  // THEN
  test("No unsuppressed Warnings", () => {
    const githubRunnerStackWarnings = Annotations.fromStack(stack).findWarning(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*")
    );
    githubRunnerStackWarnings.forEach((element) => {
      console.log({ id: element.id, data: element.entry.data });
    });
    expect(githubRunnerStackWarnings).toHaveLength(0);
  });
  test("No unsuppressed Errors", () => {
    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-VPC7",
        reason: "not relevant",
      },
    ]);

    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-S1",
        reason: "no access logs needed for a access logs bucket",
      },
    ]);

    const githubRunnerStackErrors = Annotations.fromStack(stack).findError(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*")
    );
    githubRunnerStackErrors.forEach((element) => {
      console.log({ id: element.id, data: element.entry.data });
    });

    expect(githubRunnerStackErrors).toHaveLength(0);
  });
});
