import {
  App,
  aws_apigateway as apigateway,
  aws_ec2 as ec2,
  aws_route53 as route53,
  aws_elasticloadbalancingv2 as elb,
  Stack,
} from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { InternalService } from "../src";

test("Internal Service provider", () => {
  const app = new App();
  const stack = new Stack(app, "test", {
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

  new InternalService(stack, "internalServiceStack", {
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

  const template = Template.fromStack(stack);

  template.resourcePropertiesCountIs(
    "AWS::S3::Bucket",
    {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256",
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: {
        Status: "Enabled",
      },
    },
    1
  );

  template.resourcePropertiesCountIs(
    "AWS::ElasticLoadBalancingV2::Listener",
    {
      DefaultActions: [
        {
          RedirectConfig: {
            Port: "443",
            Protocol: "HTTPS",
            StatusCode: "HTTP_301",
          },
          Type: "redirect",
        },
      ],
      LoadBalancerArn: {
        Ref: "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
      },
      Port: 80,
      Protocol: "HTTP",
    },
    1
  );

  template.resourcePropertiesCountIs(
    "AWS::EC2::SecurityGroup",
    {
      GroupDescription: "security group for a load balancer",
      SecurityGroupEgress: [
        {
          CidrIp: "0.0.0.0/0",
          Description: "Allow all outbound traffic by default",
          IpProtocol: "-1",
        },
      ],
      SecurityGroupIngress: [
        {
          CidrIp: "10.0.0.0/8",
          Description: "allow HTTPS traffic from private CIDR range",
          FromPort: 443,
          IpProtocol: "tcp",
          ToPort: 443,
        },
        {
          CidrIp: "172.16.0.0/12",
          Description: "allow HTTPS traffic from private CIDR range",
          FromPort: 443,
          IpProtocol: "tcp",
          ToPort: 443,
        },
        {
          CidrIp: "192.168.0.0/16",
          Description: "allow HTTPS traffic from private CIDR range",
          FromPort: 443,
          IpProtocol: "tcp",
          ToPort: 443,
        },
      ],
    },
    1
  );

  expect(template).toMatchInlineSnapshot(`
    Object {
      "Outputs": Object {
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

test("Internal Service Stack provider - set optional parameters", () => {
  const app = new App();
  const stack = new Stack(app, "test", {
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

  const testSecurityGroup = new ec2.SecurityGroup(
    stack,
    "loadBalancerSecurityGroup",
    {
      vpc: vpc,
      allowAllOutbound: true,
      description: "security group for a load balancer",
    }
  );

  testSecurityGroup.addIngressRule(
    ec2.Peer.anyIpv4(),
    ec2.Port.tcp(443),
    "allow HTTPS traffic from private CIDR range"
  );

  new InternalService(stack, "internalServiceStack", {
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
    customDomainSSLPolicy: apigateway.SecurityPolicy.TLS_1_0,
    loadBalancerListenerSSLPolicy: elb.SslPolicy.FORWARD_SECRECY_TLS12_RES,
    addLoadBalancerRedirect: false,
    enableLoadBalancerAccessLogs: false,
    loadBalancerSecurityGroup: testSecurityGroup,
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties(
    "AWS::ApiGateway::DomainName",
    Match.objectEquals({
      DomainName: "internalservice-dev.test.aws1234.com",
      EndpointConfiguration: {
        Types: ["REGIONAL"],
      },
      RegionalCertificateArn: {
        Ref: "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
      },
      SecurityPolicy: "TLS_1_0",
    })
  );

  template.hasResourceProperties(
    "AWS::ElasticLoadBalancingV2::Listener",
    Match.objectEquals({
      Certificates: [
        {
          CertificateArn: {
            Ref: "internalServiceStackSSLCertificateinternalServiceStack283B9A17",
          },
        },
      ],
      DefaultActions: [
        {
          TargetGroupArn: {
            Ref: "internalServiceStackTargetGroupinternalServiceStackB131C63B",
          },
          Type: "forward",
        },
      ],
      LoadBalancerArn: {
        Ref: "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
      },
      Port: 443,
      Protocol: "HTTPS",
      SslPolicy: "ELBSecurityPolicy-FS-1-2-Res-2019-08",
    })
  );

  template.resourcePropertiesCountIs(
    "AWS::S3::Bucket",
    {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256",
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      Tags: [
        {
          Key: "aws-cdk:auto-delete-objects",
          Value: "true",
        },
      ],
      VersioningConfiguration: {
        Status: "Enabled",
      },
    },
    0
  );

  template.resourcePropertiesCountIs(
    "AWS::ElasticLoadBalancingV2::Listener",
    {
      DefaultActions: [
        {
          RedirectConfig: {
            Port: "443",
            Protocol: "HTTPS",
            StatusCode: "HTTP_301",
          },
          Type: "redirect",
        },
      ],
      LoadBalancerArn: {
        Ref: "internalServiceStackApplicationLoadBalancerinternalServiceStackA9484EF3",
      },
      Port: 80,
      Protocol: "HTTP",
    },
    0
  );

  template.hasResourceProperties("AWS::EC2::SecurityGroup", {
    SecurityGroupEgress: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "Allow all outbound traffic by default",
        IpProtocol: "-1",
      },
    ],
    SecurityGroupIngress: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "allow HTTPS traffic from private CIDR range",
        FromPort: 443,
        IpProtocol: "tcp",
        ToPort: 443,
      },
    ],
  });
});
