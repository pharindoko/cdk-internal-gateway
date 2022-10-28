import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ResourceQueryResolverStack } from '../src/custom-resource-resolver.stack';
import { LocalNSLookupResolverStack } from '../src/local-nslookup-resolver.stack';

test('VPC Endpoint Custom Resource Query Resolver Stack provider', () => {
  const app = new cdk.App();
  const stack = new ResourceQueryResolverStack(app, 'vpcEndpointResolverStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    serviceName: 'internalservice',
    stage: 'dev',
    vpcEndpointId: 'vpce-1234567890',
  });
  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "VPCEndpointIpAddress0": Object {
      "Description": "VPC Endpoint IP Address ",
      "Value": Object {
        "Fn::GetAtt": Array [
          "vpcEndpointResolverStackDescribeNetworkInterfacesBF6A2ECE",
          "NetworkInterfaces.0.PrivateIpAddress",
        ],
      },
    },
    "VPCEndpointIpAddress1": Object {
      "Description": "VPC Endpoint IP Address ",
      "Value": Object {
        "Fn::GetAtt": Array [
          "vpcEndpointResolverStackDescribeNetworkInterfacesBF6A2ECE",
          "NetworkInterfaces.1.PrivateIpAddress",
        ],
      },
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
    "AWS679f53fac002430cb0da5b7982bd22872D164C4C": Object {
      "DependsOn": Array [
        "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
      ],
      "Properties": Object {
        "Code": Object {
          "S3Bucket": "cdk-hnb659fds-assets-123456789101-eu-central-1",
          "S3Key": "e845402ce43b66fc6f20df4a239f20f8662eb6c7f920b94cf6542dd0e64ce0f7.zip",
        },
        "Handler": "index.handler",
        "Role": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
            "Arn",
          ],
        },
        "Runtime": "nodejs14.x",
        "Timeout": 120,
      },
      "Type": "AWS::Lambda::Function",
    },
    "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2": Object {
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
    "vpcEndpointResolverStackDescribeNetworkInterfacesBF6A2ECE": Object {
      "DeletionPolicy": "Delete",
      "DependsOn": Array [
        "vpcEndpointResolverStackDescribeNetworkInterfacesCustomResourcePolicy6E75C922",
      ],
      "Properties": Object {
        "Create": Object {
          "Fn::Join": Array [
            "",
            Array [
              "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeNetworkInterfaces\\",\\"parameters\\":{\\"NetworkInterfaceIds\\":[\\"",
              Object {
                "Fn::GetAtt": Array [
                  "vpcEndpointResolverStackDescribeVPCEndpointsFDDDF98F",
                  "VpcEndpoints.0.NetworkInterfaceIds.0",
                ],
              },
              "\\",\\"",
              Object {
                "Fn::GetAtt": Array [
                  "vpcEndpointResolverStackDescribeVPCEndpointsFDDDF98F",
                  "VpcEndpoints.0.NetworkInterfaceIds.1",
                ],
              },
              "\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666984223970\\"}}",
            ],
          ],
        },
        "InstallLatestAwsSdk": true,
        "ServiceToken": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd22872D164C4C",
            "Arn",
          ],
        },
        "Update": Object {
          "Fn::Join": Array [
            "",
            Array [
              "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeNetworkInterfaces\\",\\"parameters\\":{\\"NetworkInterfaceIds\\":[\\"",
              Object {
                "Fn::GetAtt": Array [
                  "vpcEndpointResolverStackDescribeVPCEndpointsFDDDF98F",
                  "VpcEndpoints.0.NetworkInterfaceIds.0",
                ],
              },
              "\\",\\"",
              Object {
                "Fn::GetAtt": Array [
                  "vpcEndpointResolverStackDescribeVPCEndpointsFDDDF98F",
                  "VpcEndpoints.0.NetworkInterfaceIds.1",
                ],
              },
              "\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666984223970\\"}}",
            ],
          ],
        },
      },
      "Type": "Custom::AWS",
      "UpdateReplacePolicy": "Delete",
    },
    "vpcEndpointResolverStackDescribeNetworkInterfacesCustomResourcePolicy6E75C922": Object {
      "Properties": Object {
        "PolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "ec2:DescribeNetworkInterfaces",
              "Effect": "Allow",
              "Resource": "*",
            },
          ],
          "Version": "2012-10-17",
        },
        "PolicyName": "vpcEndpointResolverStackDescribeNetworkInterfacesCustomResourcePolicy6E75C922",
        "Roles": Array [
          Object {
            "Ref": "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
          },
        ],
      },
      "Type": "AWS::IAM::Policy",
    },
    "vpcEndpointResolverStackDescribeVPCEndpointsCustomResourcePolicy37F29399": Object {
      "Properties": Object {
        "PolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "ec2:DescribeVPCEndpoints",
              "Effect": "Allow",
              "Resource": "*",
            },
          ],
          "Version": "2012-10-17",
        },
        "PolicyName": "vpcEndpointResolverStackDescribeVPCEndpointsCustomResourcePolicy37F29399",
        "Roles": Array [
          Object {
            "Ref": "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
          },
        ],
      },
      "Type": "AWS::IAM::Policy",
    },
    "vpcEndpointResolverStackDescribeVPCEndpointsFDDDF98F": Object {
      "DeletionPolicy": "Delete",
      "DependsOn": Array [
        "vpcEndpointResolverStackDescribeVPCEndpointsCustomResourcePolicy37F29399",
      ],
      "Properties": Object {
        "Create": "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeVpcEndpoints\\",\\"parameters\\":{\\"VpcEndpointIds\\":[\\"vpce-1234567890\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666984223954\\"}}",
        "InstallLatestAwsSdk": true,
        "ServiceToken": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd22872D164C4C",
            "Arn",
          ],
        },
        "Update": "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeVpcEndpoints\\",\\"parameters\\":{\\"VpcEndpointIds\\":[\\"vpce-1234567890\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666984223954\\"}}",
      },
      "Type": "Custom::AWS",
      "UpdateReplacePolicy": "Delete",
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

test('VPC Endpoint Local NS Lookup Query Resolver Stack provider', async () => {
  const app = new cdk.App();
  const stack = new LocalNSLookupResolverStack(app, 'vpcEndpointResolverStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    serviceName: 'internalservice',
    stage: 'dev',
    vpcEndpointDnsName: 'vpce-1234567890.eu-central-1.vpce.amazonaws.com',
  });
  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Parameters": Object {
    "BootstrapVersion": Object {
      "Default": "/cdk-bootstrap/hnb659fds/version",
      "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]",
      "Type": "AWS::SSM::Parameter::Value<String>",
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