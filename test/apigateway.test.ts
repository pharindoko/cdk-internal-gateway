import {
  App,
  aws_ec2 as ec2,
  aws_route53 as route53,
  Stack,
} from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
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
let app: App;
let stack: Stack;
let internalServiceStack: InternalService;
let vpcEndpointId: ec2.IInterfaceVpcEndpoint;

beforeEach(() => {
  app = new App();
  stack = new Stack(app, "test", {
    env: {
      account: "123456789012",
      region: "us-east-1",
    },
  });

  const vpc = ec2.Vpc.fromLookup(stack, "vpc", { vpcId: "vpc-1234567" });
  const internalSubnetIds = ["subnet-1234567890", "subnet-1234567890"];
  const hostedZone = route53.HostedZone.fromLookup(stack, "hostedzone", {
    domainName: "test.aws1234.com",
    privateZone: true,
    vpcId: vpc.vpcId,
  });

  internalServiceStack = new InternalService(stack, "internalServiceStack", {
    vpc: vpc,
    subnetSelection: {
      subnets: internalSubnetIds.map((ip, index) =>
        ec2.Subnet.fromSubnetId(stack, `Subnet${index}`, ip)
      ),
    },
    vpcEndpointIPAddresses: ["192.168.2.1", "192.168.2.2"],
    subjectAlternativeNames: [
      "internalservice-dev.test.com",
      "internalservice-dev.test2.com",
    ],
    hostedZone: hostedZone,
    subDomain: "internalservice-dev",
  });
  vpcEndpointId = ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
    stack,
    "vpcEndpoint",
    {
      port: 443,
      vpcEndpointId: "vpce-1234567890",
    }
  );
});

test("Api Gateway Stack provider - set default values", () => {
  new ApiGatewayStackTest(stack, "apiGatewayStack", {
    stage: "dev",
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::RestApi",
    Match.objectLike({
      EndpointConfiguration: {
        Types: ["PRIVATE"],
      },
    })
  );

  template.hasResourceProperties(
    "AWS::ApiGateway::BasePathMapping",
    Match.objectLike({
      BasePath: "",
    })
  );

  template.hasResourceProperties(
    "AWS::ApiGateway::RestApi",
    Match.objectLike({
      Policy: {
        Statement: [
          {
            Action: "execute-api:Invoke",
            Condition: {
              StringNotEquals: {
                "aws:sourceVpce": vpcEndpointId.vpcEndpointId,
              },
            },
            Effect: "Deny",
            Principal: {
              AWS: "*",
            },
            Resource: "execute-api:/*/*/*",
          },
          {
            Action: "execute-api:Invoke",
            Condition: {
              StringEquals: {
                "aws:sourceVpce": vpcEndpointId.vpcEndpointId,
              },
            },
            Effect: "Allow",
            Principal: {
              AWS: "*",
            },
            Resource: "execute-api:/*/*/*",
          },
        ],
        Version: "2012-10-17",
      },
    })
  );

  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "apiGatewayStackGatewayapiGatewayStackEndpointD06AFED4": Object {
      "Value": Object {
        "Fn::Join": Array [
          "",
          Array [
            "https://",
            Object {
              "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
            },
            ".execute-api.us-east-1.",
            Object {
              "Ref": "AWS::URLSuffix",
            },
            "/",
            Object {
              "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStagedevF51461BA",
            },
            "/",
          ],
        ],
      },
    },
    "internalServiceStackDomainUrlinternalServiceStackB921B240": Object {
      "Description": "service url",
      "Export": Object {
        "Name": "-DomainUrl",
      },
      "Value": "https://internalservice-dev.test.aws1234.com",
    },
  },
  "Parameters": Object {
    "BootstrapVersion": Object {
      "Default": "/cdk-bootstrap/hnb659fds/version",
      "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]",
      "Type": "AWS::SSM::Parameter::Value<String>",
    },
  },
  "Resources": Object {
    "apiGatewayStackGatewayapiGatewayStackAccount7F19EDD7": Object {
      "DeletionPolicy": "Retain",
      "DependsOn": Array [
        "apiGatewayStackGatewayapiGatewayStackC685BA6E",
      ],
      "Properties": Object {
        "CloudWatchRoleArn": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackGatewayapiGatewayStackCloudWatchRole492310A9",
            "Arn",
          ],
        },
      },
      "Type": "AWS::ApiGateway::Account",
      "UpdateReplacePolicy": "Retain",
    },
    "apiGatewayStackGatewayapiGatewayStackC685BA6E": Object {
      "Properties": Object {
        "Description": "This service serves an internal api gateway",
        "EndpointConfiguration": Object {
          "Types": Array [
            "PRIVATE",
          ],
          "VpcEndpointIds": Array [
            "vpce-1234567890",
          ],
        },
        "Name": "Gateway-apiGatewayStack",
        "Policy": Object {
          "Statement": Array [
            Object {
              "Action": "execute-api:Invoke",
              "Condition": Object {
                "StringNotEquals": Object {
                  "aws:sourceVpce": "vpce-1234567890",
                },
              },
              "Effect": "Deny",
              "Principal": Object {
                "AWS": "*",
              },
              "Resource": "execute-api:/*/*/*",
            },
            Object {
              "Action": "execute-api:Invoke",
              "Condition": Object {
                "StringEquals": Object {
                  "aws:sourceVpce": "vpce-1234567890",
                },
              },
              "Effect": "Allow",
              "Principal": Object {
                "AWS": "*",
              },
              "Resource": "execute-api:/*/*/*",
            },
          ],
          "Version": "2012-10-17",
        },
      },
      "Type": "AWS::ApiGateway::RestApi",
    },
    "apiGatewayStackGatewayapiGatewayStackCloudWatchRole492310A9": Object {
      "DeletionPolicy": "Retain",
      "Properties": Object {
        "AssumeRolePolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": Object {
                "Service": "apigateway.amazonaws.com",
              },
            },
          ],
          "Version": "2012-10-17",
        },
        "ManagedPolicyArns": Array [
          Object {
            "Fn::Join": Array [
              "",
              Array [
                "arn:",
                Object {
                  "Ref": "AWS::Partition",
                },
                ":iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
              ],
            ],
          },
        ],
      },
      "Type": "AWS::IAM::Role",
      "UpdateReplacePolicy": "Retain",
    },
    "apiGatewayStackGatewayapiGatewayStackDeployment62F75EF6b20d8bd5867435b4751c15cd81903998": Object {
      "DependsOn": Array [
        "apiGatewayStackGatewayapiGatewayStackGETF8D24D55",
      ],
      "Properties": Object {
        "Description": "This service serves an internal api gateway",
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
      },
      "Type": "AWS::ApiGateway::Deployment",
    },
    "apiGatewayStackGatewayapiGatewayStackDeploymentStagedevF51461BA": Object {
      "DependsOn": Array [
        "apiGatewayStackGatewayapiGatewayStackAccount7F19EDD7",
      ],
      "Properties": Object {
        "DeploymentId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackDeployment62F75EF6b20d8bd5867435b4751c15cd81903998",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
        "StageName": "dev",
      },
      "Type": "AWS::ApiGateway::Stage",
    },
    "apiGatewayStackGatewayapiGatewayStackGETF8D24D55": Object {
      "Properties": Object {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": Object {
          "Type": "MOCK",
        },
        "ResourceId": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackGatewayapiGatewayStackC685BA6E",
            "RootResourceId",
          ],
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
      },
      "Type": "AWS::ApiGateway::Method",
    },
    "apiGatewayStacktestinternalServiceStackApiGatewayCustomDomaininternalServiceStack4041A8F9": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackApiGatewayCustomDomaininternalServiceStack836326F5",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStagedevF51461BA",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStacktestinternalServiceStackDomaininternalservicedevtest2cominternalServiceStackBE72A12C": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackDomaininternalservicedevtest2cominternalServiceStack5EFB1D61",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStagedevF51461BA",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStacktestinternalServiceStackDomaininternalservicedevtestcominternalServiceStack5EFA7076": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackDomaininternalservicedevtestcominternalServiceStackB6868874",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackC685BA6E",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStagedevF51461BA",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "internalServiceStackApiGatewayCustomDomaininternalServiceStack836326F5": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3": Object {
      "Properties": Object {
        "LoadBalancerAttributes": Array [
          Object {
            "Key": "deletion_protection.enabled",
            "Value": "false",
          },
        ],
        "Scheme": "internal",
        "SecurityGroups": Array [
          Object {
            "Fn::GetAtt": Array [
              "internalServiceStackLoadBalancerSecurityGroupinternalServiceStackB6066852",
              "GroupId",
            ],
          },
        ],
        "Subnets": Array [
          "subnet-1234567890",
          "subnet-1234567890",
        ],
        "Type": "application",
      },
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
    },
    "internalServiceStackApplicationLoadBalancerinternalServiceStackListenerinternalServiceStackAC542223": Object {
      "Properties": Object {
        "Certificates": Array [
          Object {
            "CertificateArn": Object {
              "Ref": "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
            },
          },
        ],
        "DefaultActions": Array [
          Object {
            "TargetGroupArn": Object {
              "Ref": "internalServiceStackTargetGroupinternalServiceStackB131C63B",
            },
            "Type": "forward",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
        },
        "Port": 443,
        "Protocol": "HTTPS",
      },
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
    },
    "internalServiceStackApplicationLoadBalancerinternalServiceStackRedirect80To4439382502D": Object {
      "Properties": Object {
        "DefaultActions": Array [
          Object {
            "RedirectConfig": Object {
              "Port": "443",
              "Protocol": "HTTPS",
              "StatusCode": "HTTP_301",
            },
            "Type": "redirect",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
        },
        "Port": 80,
        "Protocol": "HTTP",
      },
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
    },
    "internalServiceStackDomaininternalservicedevtest2cominternalServiceStack5EFB1D61": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test2.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackDomaininternalservicedevtestcominternalServiceStackB6868874": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackLoadBalancerSecurityGroupinternalServiceStackB6066852": Object {
      "Properties": Object {
        "GroupDescription": "security group for a load balancer",
        "SecurityGroupEgress": Array [
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic by default",
            "IpProtocol": "-1",
          },
        ],
        "SecurityGroupIngress": Array [
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "allow HTTPS traffic from anywhere",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443,
          },
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow from anyone on port 80",
            "FromPort": 80,
            "IpProtocol": "tcp",
            "ToPort": 80,
          },
        ],
        "VpcId": "vpc-12345",
      },
      "Type": "AWS::EC2::SecurityGroup",
    },
    "internalServiceStackRoute53RecordinternalServiceStack0A03BF43": Object {
      "Properties": Object {
        "AliasTarget": Object {
          "DNSName": Object {
            "Fn::Join": Array [
              "",
              Array [
                "dualstack.",
                Object {
                  "Fn::GetAtt": Array [
                    "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
                    "DNSName",
                  ],
                },
              ],
            ],
          },
          "HostedZoneId": Object {
            "Fn::GetAtt": Array [
              "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
              "CanonicalHostedZoneID",
            ],
          },
        },
        "HostedZoneId": "DUMMY",
        "Name": "internalservice-dev.test.aws1234.com.",
        "Type": "A",
      },
      "Type": "AWS::Route53::RecordSet",
    },
    "internalServiceStackSSLCertificateinternalServiceStack283B9A17": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "SubjectAlternativeNames": Array [
          "internalservice-dev.test.com",
          "internalservice-dev.test2.com",
        ],
        "Tags": Array [
          Object {
            "Key": "Name",
            "Value": "test/internalServiceStack/SSLCertificate-internalServiceStack",
          },
        ],
        "ValidationMethod": "DNS",
      },
      "Type": "AWS::CertificateManager::Certificate",
    },
    "internalServiceStackTargetGroupinternalServiceStackB131C63B": Object {
      "Properties": Object {
        "Port": 443,
        "Protocol": "HTTPS",
        "TargetGroupAttributes": Array [
          Object {
            "Key": "stickiness.enabled",
            "Value": "false",
          },
        ],
        "TargetType": "ip",
        "Targets": Array [
          Object {
            "Id": "192.168.2.1",
          },
          Object {
            "Id": "192.168.2.2",
          },
        ],
        "VpcId": "vpc-12345",
      },
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
    },
  },
  "Rules": Object {
    "CheckBootstrapVersion": Object {
      "Assertions": Array [
        Object {
          "Assert": Object {
            "Fn::Not": Array [
              Object {
                "Fn::Contains": Array [
                  Array [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                  ],
                  Object {
                    "Ref": "BootstrapVersion",
                  },
                ],
              },
            ],
          },
          "AssertDescription": "CDK bootstrap stack version 6 required. Please run 'cdk bootstrap' with a recent version of the CDK CLI.",
        },
      ],
    },
  },
}
`);
});

test("Api Gateway Stack provider - set optional parameters", () => {
  new ApiGatewayStackTest(stack, "apiGatewayStackOptionalParameters", {
    stage: "dev",
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    minimumCompressionSize: 1024,
    binaryMediaTypes: ["application/octet-stream"],
    apiBasePathMappingPath: "test",
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::RestApi",
    Match.objectLike({
      MinimumCompressionSize: 1024,
    })
  );

  template.hasResourceProperties(
    "AWS::ApiGateway::RestApi",
    Match.objectLike({
      BinaryMediaTypes: ["application/octet-stream"],
    })
  );

  template.hasResourceProperties(
    "AWS::ApiGateway::BasePathMapping",
    Match.objectLike({
      BasePath: "test",
    })
  );
});
