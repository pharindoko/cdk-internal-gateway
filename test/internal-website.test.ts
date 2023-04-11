import {
  App,
  aws_ec2 as ec2,
  aws_route53 as route53,
  Stack,
} from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { InternalService, InternalWebsite } from "../src";

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

test("Internal Website provider - set default values", () => {
  new InternalWebsite(stack, "internalGatewayStack", {
    stage: "dev",
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    sourcePath: "./test/website-sample",
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
    Object {
      "Outputs": Object {
        "internalGatewayStackGatewayinternalGatewayStackEndpoint4102CA04": Object {
          "Value": Object {
            "Fn::Join": Array [
              "",
              Array [
                "https://",
                Object {
                  "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
                },
                ".execute-api.us-east-1.",
                Object {
                  "Ref": "AWS::URLSuffix",
                },
                "/",
                Object {
                  "Ref": "internalGatewayStackGatewayinternalGatewayStackDeploymentStagedev5F843F8F",
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
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C81C01536": Object {
          "DependsOn": Array [
            "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRoleDefaultPolicy88902FDF",
            "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265",
          ],
          "Properties": Object {
            "Code": Object {
              "S3Bucket": "cdk-hnb659fds-assets-123456789012-us-east-1",
              "S3Key": "6ddcf10002539818a9256eff3fb2b22aa09298d8f946e26ba121c175a600c44e.zip",
            },
            "Handler": "index.handler",
            "Layers": Array [
              Object {
                "Ref": "internalGatewayStackWebsiteDeploymentinternalGatewayStackAwsCliLayer57780F1C",
              },
            ],
            "Role": Object {
              "Fn::GetAtt": Array [
                "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265",
                "Arn",
              ],
            },
            "Runtime": "python3.9",
            "Timeout": 900,
          },
          "Type": "AWS::Lambda::Function",
        },
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265": Object {
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
                "Fn::Join": Array [
                  "",
                  Array [
                    "arn:",
                    Object {
                      "Ref": "AWS::Partition",
                    },
                    ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                  ],
                ],
              },
            ],
          },
          "Type": "AWS::IAM::Role",
        },
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRoleDefaultPolicy88902FDF": Object {
          "Properties": Object {
            "PolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": Array [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*",
                  ],
                  "Effect": "Allow",
                  "Resource": Array [
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          "arn:",
                          Object {
                            "Ref": "AWS::Partition",
                          },
                          ":s3:::cdk-hnb659fds-assets-123456789012-us-east-1",
                        ],
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          "arn:",
                          Object {
                            "Ref": "AWS::Partition",
                          },
                          ":s3:::cdk-hnb659fds-assets-123456789012-us-east-1/*",
                        ],
                      ],
                    },
                  ],
                },
                Object {
                  "Action": Array [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*",
                    "s3:DeleteObject*",
                    "s3:PutObject",
                    "s3:PutObjectLegalHold",
                    "s3:PutObjectRetention",
                    "s3:PutObjectTagging",
                    "s3:PutObjectVersionTagging",
                    "s3:Abort*",
                  ],
                  "Effect": "Allow",
                  "Resource": Array [
                    Object {
                      "Fn::GetAtt": Array [
                        "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
              ],
              "Version": "2012-10-17",
            },
            "PolicyName": "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRoleDefaultPolicy88902FDF",
            "Roles": Array [
              Object {
                "Ref": "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265",
              },
            ],
          },
          "Type": "AWS::IAM::Policy",
        },
        "CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F": Object {
          "DependsOn": Array [
            "CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092",
          ],
          "Properties": Object {
            "Code": Object {
              "S3Bucket": "cdk-hnb659fds-assets-123456789012-us-east-1",
              "S3Key": "e57c1acaa363d7d2b81736776007a7091bc73dff4aeb8135627c4511a51e7dca.zip",
            },
            "Description": Object {
              "Fn::Join": Array [
                "",
                Array [
                  "Lambda function for auto-deleting objects in ",
                  Object {
                    "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
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
            "Runtime": "nodejs14.x",
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
        "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackCB025027": Object {
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
          },
          "Type": "AWS::IAM::Role",
        },
        "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackDefaultPolicy6443C420": Object {
          "Properties": Object {
            "PolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": Array [
                    "s3:GetObject",
                    "s3:GetObjectAcl",
                    "s3:ListBucket",
                  ],
                  "Effect": "Allow",
                  "Resource": Array [
                    Object {
                      "Fn::GetAtt": Array [
                        "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
              ],
              "Version": "2012-10-17",
            },
            "PolicyName": "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackDefaultPolicy6443C420",
            "Roles": Array [
              Object {
                "Ref": "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackCB025027",
              },
            ],
          },
          "Type": "AWS::IAM::Policy",
        },
        "internalGatewayStackGatewayinternalGatewayStack16717335": Object {
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
            "Name": "Gateway-internalGatewayStack",
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
        "internalGatewayStackGatewayinternalGatewayStackANY270EDB4A": Object {
          "Properties": Object {
            "AuthorizationType": "NONE",
            "HttpMethod": "ANY",
            "Integration": Object {
              "Credentials": Object {
                "Fn::GetAtt": Array [
                  "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackCB025027",
                  "Arn",
                ],
              },
              "IntegrationHttpMethod": "GET",
              "IntegrationResponses": Array [
                Object {
                  "ResponseParameters": Object {
                    "method.response.header.Content-Type": "integration.response.header.Content-Type",
                  },
                  "SelectionPattern": "2..",
                  "StatusCode": "200",
                },
                Object {
                  "SelectionPattern": "4..",
                  "StatusCode": "403",
                },
              ],
              "Type": "AWS",
              "Uri": Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    "arn:",
                    Object {
                      "Ref": "AWS::Partition",
                    },
                    ":apigateway:us-east-1:s3:path/",
                    Object {
                      "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                    },
                    "/index.html",
                  ],
                ],
              },
            },
            "MethodResponses": Array [
              Object {
                "ResponseParameters": Object {
                  "method.response.header.Content-Type": true,
                },
                "StatusCode": "200",
              },
            ],
            "RequestParameters": Object {
              "method.request.path.proxy": true,
            },
            "ResourceId": Object {
              "Fn::GetAtt": Array [
                "internalGatewayStackGatewayinternalGatewayStack16717335",
                "RootResourceId",
              ],
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
          },
          "Type": "AWS::ApiGateway::Method",
        },
        "internalGatewayStackGatewayinternalGatewayStackAccountE55E37CC": Object {
          "DeletionPolicy": "Retain",
          "DependsOn": Array [
            "internalGatewayStackGatewayinternalGatewayStack16717335",
          ],
          "Properties": Object {
            "CloudWatchRoleArn": Object {
              "Fn::GetAtt": Array [
                "internalGatewayStackGatewayinternalGatewayStackCloudWatchRoleA7C069E8",
                "Arn",
              ],
            },
          },
          "Type": "AWS::ApiGateway::Account",
          "UpdateReplacePolicy": "Retain",
        },
        "internalGatewayStackGatewayinternalGatewayStackCloudWatchRoleA7C069E8": Object {
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
        "internalGatewayStackGatewayinternalGatewayStackDeployment754882BEf8dca1f7e640b3bb960d81e0ff81b7e9": Object {
          "DependsOn": Array [
            "internalGatewayStackGatewayinternalGatewayStackproxyANYFEAB94E3",
            "internalGatewayStackGatewayinternalGatewayStackproxy9B658BE0",
            "internalGatewayStackGatewayinternalGatewayStackANY270EDB4A",
          ],
          "Properties": Object {
            "Description": "This service serves an internal api gateway",
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
          },
          "Type": "AWS::ApiGateway::Deployment",
        },
        "internalGatewayStackGatewayinternalGatewayStackDeploymentStagedev5F843F8F": Object {
          "DependsOn": Array [
            "internalGatewayStackGatewayinternalGatewayStackAccountE55E37CC",
          ],
          "Properties": Object {
            "DeploymentId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStackDeployment754882BEf8dca1f7e640b3bb960d81e0ff81b7e9",
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
            "StageName": "dev",
          },
          "Type": "AWS::ApiGateway::Stage",
        },
        "internalGatewayStackGatewayinternalGatewayStackproxy9B658BE0": Object {
          "Properties": Object {
            "ParentId": Object {
              "Fn::GetAtt": Array [
                "internalGatewayStackGatewayinternalGatewayStack16717335",
                "RootResourceId",
              ],
            },
            "PathPart": "{proxy+}",
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
          },
          "Type": "AWS::ApiGateway::Resource",
        },
        "internalGatewayStackGatewayinternalGatewayStackproxyANYFEAB94E3": Object {
          "Properties": Object {
            "AuthorizationType": "NONE",
            "HttpMethod": "ANY",
            "Integration": Object {
              "Credentials": Object {
                "Fn::GetAtt": Array [
                  "internalGatewayStackApiGatewayReadOnlyRoleinternalGatewayStackCB025027",
                  "Arn",
                ],
              },
              "IntegrationHttpMethod": "GET",
              "IntegrationResponses": Array [
                Object {
                  "ResponseParameters": Object {
                    "method.response.header.Content-Type": "integration.response.header.Content-Type",
                  },
                  "SelectionPattern": "2..",
                  "StatusCode": "200",
                },
                Object {
                  "SelectionPattern": "4..",
                  "StatusCode": "403",
                },
              ],
              "RequestParameters": Object {
                "integration.request.path.proxy": "method.request.path.proxy",
              },
              "Type": "AWS",
              "Uri": Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    "arn:",
                    Object {
                      "Ref": "AWS::Partition",
                    },
                    ":apigateway:us-east-1:s3:path/",
                    Object {
                      "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                    },
                    "/{proxy}",
                  ],
                ],
              },
            },
            "MethodResponses": Array [
              Object {
                "ResponseParameters": Object {
                  "method.response.header.Content-Type": true,
                },
                "StatusCode": "200",
              },
            ],
            "RequestParameters": Object {
              "method.request.path.proxy": true,
            },
            "ResourceId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStackproxy9B658BE0",
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
          },
          "Type": "AWS::ApiGateway::Method",
        },
        "internalGatewayStackWebsiteBucketinternalGatewayStackAutoDeleteObjectsCustomResource27685893": Object {
          "DeletionPolicy": "Delete",
          "DependsOn": Array [
            "internalGatewayStackWebsiteBucketinternalGatewayStackPolicy1913132B",
          ],
          "Properties": Object {
            "BucketName": Object {
              "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
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
        "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09": Object {
          "DeletionPolicy": "Delete",
          "Properties": Object {
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
              Object {
                "Key": "aws-cdk:cr-owned:917df6a0",
                "Value": "true",
              },
            ],
            "VersioningConfiguration": Object {
              "Status": "Enabled",
            },
            "WebsiteConfiguration": Object {
              "IndexDocument": "index.html",
            },
          },
          "Type": "AWS::S3::Bucket",
          "UpdateReplacePolicy": "Delete",
        },
        "internalGatewayStackWebsiteBucketinternalGatewayStackPolicy1913132B": Object {
          "Properties": Object {
            "Bucket": Object {
              "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
            },
            "PolicyDocument": Object {
              "Statement": Array [
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
                        "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
              ],
              "Version": "2012-10-17",
            },
          },
          "Type": "AWS::S3::BucketPolicy",
        },
        "internalGatewayStackWebsiteDeploymentinternalGatewayStackAwsCliLayer57780F1C": Object {
          "Properties": Object {
            "Content": Object {
              "S3Bucket": "cdk-hnb659fds-assets-123456789012-us-east-1",
              "S3Key": "c409e6c5845f1f349df8cd84e160bf6f1c35d2b060b63e1f032f9bd39d4542cc.zip",
            },
            "Description": "/opt/awscli/aws",
          },
          "Type": "AWS::Lambda::LayerVersion",
        },
        "internalGatewayStackWebsiteDeploymentinternalGatewayStackCustomResourceCE904C61": Object {
          "DeletionPolicy": "Delete",
          "Properties": Object {
            "DestinationBucketName": Object {
              "Ref": "internalGatewayStackWebsiteBucketinternalGatewayStackBF609A09",
            },
            "Prune": true,
            "ServiceToken": Object {
              "Fn::GetAtt": Array [
                "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C81C01536",
                "Arn",
              ],
            },
            "SourceBucketNames": Array [
              "cdk-hnb659fds-assets-123456789012-us-east-1",
            ],
            "SourceObjectKeys": Array [
              "387c754ea2daf522842e23f74232b2c455937afe2e90e7c8d173275b0706342a.zip",
            ],
          },
          "Type": "Custom::CDKBucketDeployment",
          "UpdateReplacePolicy": "Delete",
        },
        "internalGatewayStacktestinternalServiceStackApiGatewayCustomDomaininternalServiceStackCFCBFC75": Object {
          "Properties": Object {
            "BasePath": "",
            "DomainName": Object {
              "Ref": "internalServiceStackApiGatewayCustomDomaininternalServiceStack836326F5",
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
            "Stage": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStackDeploymentStagedev5F843F8F",
            },
          },
          "Type": "AWS::ApiGateway::BasePathMapping",
        },
        "internalGatewayStacktestinternalServiceStackDomaininternalservicedevtest2cominternalServiceStackB33D4C7F": Object {
          "Properties": Object {
            "BasePath": "",
            "DomainName": Object {
              "Ref": "internalServiceStackDomaininternalservicedevtest2cominternalServiceStack5EFB1D61",
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
            "Stage": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStackDeploymentStagedev5F843F8F",
            },
          },
          "Type": "AWS::ApiGateway::BasePathMapping",
        },
        "internalGatewayStacktestinternalServiceStackDomaininternalservicedevtestcominternalServiceStack590A0ACC": Object {
          "Properties": Object {
            "BasePath": "",
            "DomainName": Object {
              "Ref": "internalServiceStackDomaininternalservicedevtestcominternalServiceStackB6868874",
            },
            "RestApiId": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStack16717335",
            },
            "Stage": Object {
              "Ref": "internalGatewayStackGatewayinternalGatewayStackDeploymentStagedev5F843F8F",
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
            "SslPolicy": "ELBSecurityPolicy-FS-1-2-Res-2020-10",
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
  new InternalWebsite(stack, "internalApiGatewayStackOptionalParameters", {
    stage: "dev",
    domains: internalServiceStack.domains,
    vpcEndpoint: vpcEndpointId,
    sourcePath: "./test/website-sample",
    websiteIndexDocument: "test.html",
    bucketName: "test-bucket",
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties(
    "AWS::S3::Bucket",
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: "test.html",
      },
    })
  );

  template.hasResourceProperties(
    "AWS::S3::Bucket",
    Match.objectLike({
      BucketName: "test-bucket",
    })
  );

  template.hasResourceProperties(
    "AWS::ApiGateway::Method",
    Match.objectLike({
      Integration: {
        Uri: {
          "Fn::Join": [
            "",
            [
              "arn:",
              {
                Ref: "AWS::Partition",
              },
              ":apigateway:us-east-1:s3:path/",
              {
                Ref: "internalApiGatewayStackOptionalParametersWebsiteBucketinternalApiGatewayStackOptionalParameters2269B1C9",
              },
              "/test.html",
            ],
          ],
        },
      },
    })
  );
});
