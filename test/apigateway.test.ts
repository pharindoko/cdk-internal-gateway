import {
  App,
  Size,
  Stack,
  aws_apigateway as apigateway,
  aws_ec2 as ec2,
  aws_route53 as route53,
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
                  "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStageprodEB2E72B0",
                },
                "/",
              ],
            ],
          },
        },
        "internalServiceStackDomainUrlinternalServiceStackB921B240": Object {
          "Description": "service url",
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
        "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F": Object {
          "DependsOn": Array [
            "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
          ],
          "Properties": Object {
            "Code": Object {
              "S3Bucket": "cdk-hnb659fds-assets-123456789012-us-east-1",
              "S3Key": "350185a1069fa20a23a583e20c77f6844218bd73097902362dc94f1a108f5d89.zip",
            },
            "Description": Object {
              "Fn::Join": Array [
                "",
                Array [
                  "Lambda function for auto-deleting objects in ",
                  Object {
                    "Ref": "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                  },
                  " S3 bucket.",
                ],
              ],
            },
            "Handler": "__entrypoint__.handler",
            "MemorySize": 128,
            "Role": Object {
              "Fn::GetAtt": Array [
                "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
                "Arn",
              ],
            },
            "Runtime": "nodejs16.x",
            "Timeout": 900,
          },
          "Type": "AWS::Lambda::Function",
        },
        "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092": Object {
          "Properties": Object {
            "AssumeRolePolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": "sts:AssumeRole",
                  "Effect": "Allow",
                  "Principal": Object {
                    "Service": "lambda.amazonaws.com",
                  },
                },
              ],
              "Version": "2012-10-17",
            },
            "ManagedPolicyArns": Array [
              Object {
                "Fn::Sub": "arn:\${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
              },
            ],
          },
          "Type": "AWS::IAM::Role",
        },
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
        "apiGatewayStackGatewayapiGatewayStackDeploymentStageprodEB2E72B0": Object {
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
            "StageName": "prod",
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
              "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStageprodEB2E72B0",
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
              "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStageprodEB2E72B0",
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
              "Ref": "apiGatewayStackGatewayapiGatewayStackDeploymentStageprodEB2E72B0",
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
        "internalServiceStackApplicationLoadBalancerLogsid63B637FA": Object {
          "DeletionPolicy": "Delete",
          "Properties": Object {
            "BucketEncryption": Object {
              "ServerSideEncryptionConfiguration": Array [
                Object {
                  "ServerSideEncryptionByDefault": Object {
                    "SSEAlgorithm": "AES256",
                  },
                },
              ],
            },
            "PublicAccessBlockConfiguration": Object {
              "BlockPublicAcls": true,
              "BlockPublicPolicy": true,
              "IgnorePublicAcls": true,
              "RestrictPublicBuckets": true,
            },
            "Tags": Array [
              Object {
                "Key": "aws-cdk:auto-delete-objects",
                "Value": "true",
              },
            ],
            "VersioningConfiguration": Object {
              "Status": "Enabled",
            },
          },
          "Type": "AWS::S3::Bucket",
          "UpdateReplacePolicy": "Delete",
        },
        "internalServiceStackApplicationLoadBalancerLogsidAutoDeleteObjectsCustomResourceBEEA6E8A": Object {
          "DeletionPolicy": "Delete",
          "DependsOn": Array [
            "internalServiceStackApplicationLoadBalancerLogsidPolicyA6863BEF",
          ],
          "Properties": Object {
            "BucketName": Object {
              "Ref": "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
            },
            "ServiceToken": Object {
              "Fn::GetAtt": Array [
                "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F",
                "Arn",
              ],
            },
          },
          "Type": "Custom::S3AutoDeleteObjects",
          "UpdateReplacePolicy": "Delete",
        },
        "internalServiceStackApplicationLoadBalancerLogsidPolicyA6863BEF": Object {
          "Properties": Object {
            "Bucket": Object {
              "Ref": "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
            },
            "PolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": "s3:*",
                  "Condition": Object {
                    "Bool": Object {
                      "aws:SecureTransport": "false",
                    },
                  },
                  "Effect": "Deny",
                  "Principal": Object {
                    "AWS": "*",
                  },
                  "Resource": Array [
                    Object {
                      "Fn::GetAtt": Array [
                        "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
                Object {
                  "Action": Array [
                    "s3:GetBucket*",
                    "s3:List*",
                    "s3:DeleteObject*",
                  ],
                  "Effect": "Allow",
                  "Principal": Object {
                    "AWS": Object {
                      "Fn::GetAtt": Array [
                        "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
                        "Arn",
                      ],
                    },
                  },
                  "Resource": Array [
                    Object {
                      "Fn::GetAtt": Array [
                        "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
                Object {
                  "Action": "s3:PutObject",
                  "Effect": "Allow",
                  "Principal": Object {
                    "AWS": Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          "arn:",
                          Object {
                            "Ref": "AWS::Partition",
                          },
                          ":iam::127311923021:root",
                        ],
                      ],
                    },
                  },
                  "Resource": Object {
                    "Fn::Join": Array [
                      "",
                      Array [
                        Object {
                          "Fn::GetAtt": Array [
                            "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                            "Arn",
                          ],
                        },
                        "/AWSLogs/123456789012/*",
                      ],
                    ],
                  },
                },
                Object {
                  "Action": "s3:PutObject",
                  "Condition": Object {
                    "StringEquals": Object {
                      "s3:x-amz-acl": "bucket-owner-full-control",
                    },
                  },
                  "Effect": "Allow",
                  "Principal": Object {
                    "Service": "delivery.logs.amazonaws.com",
                  },
                  "Resource": Object {
                    "Fn::Join": Array [
                      "",
                      Array [
                        Object {
                          "Fn::GetAtt": Array [
                            "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                            "Arn",
                          ],
                        },
                        "/AWSLogs/123456789012/*",
                      ],
                    ],
                  },
                },
                Object {
                  "Action": "s3:GetBucketAcl",
                  "Effect": "Allow",
                  "Principal": Object {
                    "Service": "delivery.logs.amazonaws.com",
                  },
                  "Resource": Object {
                    "Fn::GetAtt": Array [
                      "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                      "Arn",
                    ],
                  },
                },
              ],
              "Version": "2012-10-17",
            },
          },
          "Type": "AWS::S3::BucketPolicy",
        },
        "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3": Object {
          "DependsOn": Array [
            "internalServiceStackApplicationLoadBalancerLogsidAutoDeleteObjectsCustomResourceBEEA6E8A",
            "internalServiceStackApplicationLoadBalancerLogsidPolicyA6863BEF",
            "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
          ],
          "Properties": Object {
            "LoadBalancerAttributes": Array [
              Object {
                "Key": "deletion_protection.enabled",
                "Value": "false",
              },
              Object {
                "Key": "access_logs.s3.enabled",
                "Value": "true",
              },
              Object {
                "Key": "access_logs.s3.bucket",
                "Value": Object {
                  "Ref": "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
                },
              },
              Object {
                "Key": "access_logs.s3.prefix",
                "Value": "",
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
          "DependsOn": Array [
            "internalServiceStackApplicationLoadBalancerLogsidAutoDeleteObjectsCustomResourceBEEA6E8A",
            "internalServiceStackApplicationLoadBalancerLogsidPolicyA6863BEF",
            "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
          ],
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
            "SslPolicy": "ELBSecurityPolicy-FS-1-2-Res-2020-10",
          },
          "Type": "AWS::ElasticLoadBalancingV2::Listener",
        },
        "internalServiceStackApplicationLoadBalancerinternalServiceStackRedirect80To4439382502D": Object {
          "DependsOn": Array [
            "internalServiceStackApplicationLoadBalancerLogsidAutoDeleteObjectsCustomResourceBEEA6E8A",
            "internalServiceStackApplicationLoadBalancerLogsidPolicyA6863BEF",
            "internalServiceStackApplicationLoadBalancerLogsid63B637FA",
          ],
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
                "CidrIp": "10.0.0.0/8",
                "Description": "allow HTTPS traffic from private CIDR range",
                "FromPort": 443,
                "IpProtocol": "tcp",
                "ToPort": 443,
              },
              Object {
                "CidrIp": "172.16.0.0/12",
                "Description": "allow HTTPS traffic from private CIDR range",
                "FromPort": 443,
                "IpProtocol": "tcp",
                "ToPort": 443,
              },
              Object {
                "CidrIp": "192.168.0.0/16",
                "Description": "allow HTTPS traffic from private CIDR range",
                "FromPort": 443,
                "IpProtocol": "tcp",
                "ToPort": 443,
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
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    minCompressionSize: Size.kibibytes(1000),
    binaryMediaTypes: ["application/octet-stream"],
    apiBasePathMappingPath: "test",
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::RestApi",
    Match.objectLike({
      MinimumCompressionSize: 1024000,
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

test("Api Gateway Stack provider - set deprecated stage parameter", () => {
  new ApiGatewayStackTest(stack, "apiGatewayStackOptionalParameters", {
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    stage: "dev",
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::Stage",
    Match.objectLike({
      StageName: "dev",
      RestApiId: {
        Ref: "apiGatewayStackOptionalParametersGatewayapiGatewayStackOptionalParameters47F8C933",
      },
    })
  );
});

test("Api Gateway Stack provider - set no stage parameter", () => {
  new ApiGatewayStackTest(stack, "apiGatewayStackOptionalParameters", {
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::Stage",
    Match.objectLike({
      StageName: "prod",
      RestApiId: {
        Ref: "apiGatewayStackOptionalParametersGatewayapiGatewayStackOptionalParameters47F8C933",
      },
    })
  );
});

test("Api Gateway Stack provider - set stage parameter with deployOptions", () => {
  new ApiGatewayStackTest(stack, "apiGatewayStackOptionalParameters", {
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    deployOptions: {
      stageName: "test",
    },
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::ApiGateway::Stage",
    Match.objectLike({
      StageName: "test",
      RestApiId: {
        Ref: "apiGatewayStackOptionalParametersGatewayapiGatewayStackOptionalParameters47F8C933",
      },
    })
  );
});

test("Api Gateway Stack EndpointConfiguration - Exception Wrong EndpointType", () => {
  expect(() => {
    new ApiGatewayStackTest(stack, "apiGatewayStackExceptionWrongType", {
      domains: internalServiceStack.domains,
      vpcEndpoint: vpcEndpointId,
      deployOptions: {
        stageName: "test",
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
    });
  }).toThrowError(
    "InternalApiGateway: endpointConfiguration.types must be EndpointType.PRIVATE"
  );
});

test("Api Gateway Stack EndpointConfiguration - Exception No VPC Endpoint provided", () => {
  expect(() => {
    new ApiGatewayStackTest(stack, "apiGatewayStackExceptionNoVpcEndpoint", {
      domains: internalServiceStack.domains,
      vpcEndpoint: vpcEndpointId,
      deployOptions: {
        stageName: "test",
      },
      endpointConfiguration: {
        vpcEndpoints: [],
        types: [apigateway.EndpointType.PRIVATE],
      },
    });
  }).toThrowError(
    "InternalApiGateway: endpointConfiguration.vpcEndpoints must be set"
  );
});
