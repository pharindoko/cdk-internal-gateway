import {
  App,
  Aspects,
  RemovalPolicy,
  Stack,
  aws_apigateway as apigateway,
  aws_ec2 as ec2,
  aws_route53 as route53,
} from "aws-cdk-lib";
import { Annotations, Match } from "aws-cdk-lib/assertions";
// eslint-disable-next-line import/no-extraneous-dependencies
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import {
  InternalApiGateway,
  InternalApiGatewayProps,
  InternalService,
} from "../src";

export class ApiGatewayStackTest extends InternalApiGateway {
  constructor(scope: Construct, id: string, props: InternalApiGatewayProps) {
    super(scope, id, props);
    this.apiGateway.root.addMethod("GET", undefined);
  }
}
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

    const internalServiceStack = new InternalService(
      stack,
      "internal-service",
      {
        subnetSelection: vpcPublicSubnets,
        subDomain: "vt-runner",
        vpcEndpointIPAddresses: ["192.168.2.1", "192.168.2.2"],
        subjectAlternativeNames: ["test.example.io"],
        hostedZone,
        vpc,
      }
    );

    let vpcEndpointId =
      ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
        stack,
        "vpcEndpoint",
        {
          port: 443,
          vpcEndpointId: "vpce-1234567890",
        }
      );
    const logGroup = new LogGroup(stack, "LogGroup", {
      logGroupName: "/aws/apigateway/my-api",
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const accessLogDestination = new apigateway.LogGroupLogDestination(
      logGroup
    );
    const accessLogFormat = apigateway.AccessLogFormat.jsonWithStandardFields();

    new ApiGatewayStackTest(stack, "apiGatewayStack", {
      domains: internalServiceStack.domains,
      vpcEndpoint: vpcEndpointId,
      deployOptions: {
        stageName: "dev",
        accessLogDestination,
        accessLogFormat,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
    });

    Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
  });

  // THEN
  test("No unsuppressed Warnings", () => {
    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-APIG3",
        reason: "AWS WAFv2 is not required for internal projects",
      },
    ]);

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
        reason:
          "No additional access logs needed for the load balancer access logs bucket",
      },
    ]);

    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-APIG4",
        reason:
          "The API does not implement authorization. Depends on solution requested.",
      },
    ]);

    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-APIG2",
        reason: "Input validation depends on solution requested.",
      },
    ]);

    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-COG4",
        reason:
          "The API GW method does not use a Cognito user pool authorizer. Depends on solution requested.",
      },
    ]);

    NagSuppressions.addStackSuppressions(stack, [
      {
        id: "AwsSolutions-IAM4",
        reason:
          "AmazonAPIGatewayPushToCloudWatchLogs is a default role set by aws cdk.",
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
