# CDK Internal Gateway

This CDK construct is used to create internal serverless applications and websites.

By default the aws api gateway endpoints are public and accessible from the internet.
Even in times of zero trust, for larger companies it`s not a bad idea to have an additional security layer for internal applications.
But it is still a huge of effort to configure and implement all aws components in a secure manner.

This construct tries to simplify the setup.

## Features

- no traffic will be routed over the internet
- restricts access to the internal network of your company
- create and attach custom domains and certificates 
- create your internal websites and backends using api gateway integrations (see samples folder)

## Requirements

- CDK V2
- VPC
- VPC Endpoint for execute-api

## Installation

```bash
npm i
```

## Architecture

![cdk internal gateway](cdk-internal-gateway.drawio.png )

## How to use it ?

Let`s assume we want to create a simple internal api for our company.  

1. Create a file called `/lib/my-new-stack.ts`

```typescript
import { aws_apigateway as apigateway, aws_ec2 as ec2, aws_lambda as lambda, Stack, StackProps } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { InternalApiGatewayStack, InternalApiGatewayStackProps, InternalServiceStack } from 'cdk-internal-gateway';
import { Construct } from 'constructs';
import * as path from 'path';


// Create a new stack that inherits from the InternalApiGateway Construct
// Attach your lambda function to the internalApiGateway (member variable)
export class ServerlessStack extends InternalApiGatewayStack {
    constructor(scope: Construct, id: string, props: InternalApiGatewayStackProps) {
        super(scope, id, props);
        this.internalApiGateway.root;
        const defaultLambdaJavascript = this.internalApiGateway.root.resourceForPath("hey-js");
        const defaultHandlerJavascript = new lambda.Function(
            this,
            `backendLambdaJavascript`,
            {
                functionName: `js-lambda`,
                runtime: lambda.Runtime.NODEJS_14_X,
                handler: "index.handler",
                code: lambda.Code.fromAsset(path.join(__dirname, "../src")),
            }
        );

        defaultLambdaJavascript.addMethod(
            HttpMethod.GET,
            new apigateway.LambdaIntegration(defaultHandlerJavascript)
        );
    }
}

// Create a new stack that contains the whole service with all nested stacks
export class ServiceStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // get all parameters to create the internal service stack
        const vpc = ec2.Vpc.fromLookup(this, 'vpcLookup', { vpcId: 'vpc-1234567890' });
        const internalSubnetIds = ['subnet-0b1e1c6c7d8e9f0a2', 'subnet-0b1e1c6c7d8e9f0a3'];
        const subnetSelection = {
            subnets: internalSubnetIds.map((ip, index) =>
                ec2.Subnet.fromSubnetId(this, `Subnet${index}`, ip),
            ),
        };

        // create the internal service stack
        const internalServiceStack = new InternalServiceStack(this, 'InternalServiceStack', {
            hostedZoneName: 'example.com',
            subnetSelection: subnetSelection,
            vpcEndpointId: 'vpce-1234567890',
            vpcEndpointIPAddresses: ['192.168.2.1', '192.168.2.2'],
            vpc: vpc,
            subjectAlternativeNames: ['internal.example.com'],
            subDomain: "internal-service"
        })

        // create your stack that inherits from the InternalApiGatewayStack
        new ServerlessStack(this, 'MyProjectStack', {
            domains: serviceStack.domains,
            stage: "dev",
            vpcEndpointId: serviceStack.vpcEndpointId,
        })
    }
}
```

2. Reference the newly created `ServiceStack` in the default `/bin/{project}.ts` file e.g. like this

```typescript
new ServiceStack(app, 'MyProjectStack', {
  env:
  {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
```

## Costs

You have to expect basic infra costs for 2 components in this setup:  

| Count |  Type |  Estimated Costs | 
|---|---|---|
|1 x| application load balancer  | 20 $  | 
|2 x| network interfaces for the vpc endpoint  | 16 $  |

A shared vpc can lower the costs as vpc endpoint and their network interfaces can be used together...  




