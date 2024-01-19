[![npm version](https://badge.fury.io/js/cdk-internal-gateway.svg)](https://badge.fury.io/js/cdk-internal-gateway)
[![PyPI version](https://badge.fury.io/py/pharindoko.cdk-internal-gateway.svg)](https://badge.fury.io/py/pharindoko.cdk-internal-gateway)
[![Release](https://github.com/pharindoko/cdk-internal-gateway/actions/workflows/release.yml/badge.svg)](https://github.com/pharindoko/cdk-internal-gateway/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/pharindoko/cdk-internal-gateway/blob/main/LICENSE)

# CDK Internal Gateway

Use this CDK construct to create **internal serverless applications**.

Useful for larger companies to create internal  serverless applications that are not exposed to the internet and only accessible from the internal network.

## Installation

Using Typescript for aws cdk

```bash
npm i cdk-internal-gateway
```

Using Python for aws cdk

```bash
pip install pharindoko.cdk-internal-gateway
```

## Architecture

![cdk-internal-gateway-architecture](cdk-internal-gateway.drawio.png )

### Technical Details

Modularized approach with separate constructs

- attach multiple InternalApiGateway and InternalWebsite constructs to the same Internal Service to save costs and keep flexibility

**Internal Service Construct (mandatory construct):**

- creates an internal application loadbalancer
  - forwards traffic to VPC endpoint for execute-api
  - redirect http to https
- generates custom domains for the API Gateway
- generates certificates for the loadbalancer listener

**Internal Api Gateway Construct:**

- provides a securely configured apigateway resource out of the box
  - attach your aws components to the internal apigateway resource
  - sets api gateway to PRIVATE mode
  - sets resource policies to only allow traffic from vpc endpoint
- attaches custom domains to the API Gateway
- attaches certificates to the the API Gateway and the loadbalancer

**Internal Website Construct:**

- makes your website internally accessible
- redeploys your website with a single cdk deploy
- provides a securely configured private s3 bucket out of box
- works with SPA applications (written with Vue, Angular) and static websites
- is an extension of the InternalApiGateway Construct

## Requirements

- CDK V2 (2.46.0)
- A VPC
- A VPC Endpoint for execute-api
- A Hosted Zone
- Internally accessible subnets (for the load balancer)

## Usage

> Let`s assume we create a simple internal api for our company and start with a single lambda function...

1. Create a file called `/lib/my-new-stack.ts`

    ```typescript
    import { aws_apigateway as apigateway, aws_ec2 as ec2, aws_lambda as lambda, aws_route53 as route53, Stack, StackProps } from 'aws-cdk-lib';
    import { HttpMethod } from 'aws-cdk-lib/aws-events';
    import { InternalApiGateway, InternalApiGatewayProps, InternalService } from 'cdk-internal-gateway';
    import { Construct } from 'constructs';
    import * as path from 'path';

    // Create a new stack that inherits from the InternalApiGateway Construct
    export class ServerlessStack extends InternalApiGateway {
        constructor(scope: Construct, id: string, props: InternalApiGatewayProps) {
            super(scope, id, props);

            // The internal api gateway is available as member variable
            // Attach your lambda function to the this.apiGateway
            const defaultLambdaJavascript = this.apiGateway.root.resourceForPath("hey-js");
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
            const subnetSelection = {
                subnets: ['subnet-0b1e1c6c7d8e9f0a2', 'subnet-0b1e1c6c7d8e9f0a3'].map((ip, index) =>
                    ec2.Subnet.fromSubnetId(this, `Subnet${index}`, ip),
                ),
            };
            const hostedZone = route53.HostedZone.fromLookup(this, 'hostedzone', {
                domainName: 'test.aws1234.com',
                privateZone: true,
                vpcId: vpc.vpcId,
            });
            const vpcEndpoint =
                ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
                    this,
                    'vpcEndpoint',
                    {
                        port: 443,
                        vpcEndpointId: 'vpce-1234567890',
                    },
                );

            // create the internal service stack
            const serviceStack = new InternalService(this, 'InternalServiceStack', {
                hostedZone: hostedZone,
                subnetSelection: subnetSelection,
                vpcEndpointIPAddresses: ['192.168.2.1', '192.168.2.2'],
                vpc: vpc,
                subjectAlternativeNames: ['internal.example.com'],
                subDomain: "internal-service"
            })

            // create your stack that inherits from the InternalApiGateway
            new ServerlessStack(this, 'MyProjectStack', {
                domains: serviceStack.domains,
                stage: "dev",
                vpcEndpoint: vpcEndpoint,
            })

            // create another stack that inherits from the InternalApiGateway
            ...
            ...
        }
    }
    ```

1. Reference the newly created `ServiceStack` in the default `/bin/{project}.ts` file e.g. like this

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

# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### InternalApiGateway <a name="InternalApiGateway" id="cdk-internal-gateway.InternalApiGateway"></a>

#### Initializers <a name="Initializers" id="cdk-internal-gateway.InternalApiGateway.Initializer"></a>

```typescript
import { InternalApiGateway } from 'cdk-internal-gateway'

new InternalApiGateway(scope: Construct, id: string, props: InternalApiGatewayProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-internal-gateway.InternalApiGatewayProps">InternalApiGatewayProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-internal-gateway.InternalApiGateway.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-internal-gateway.InternalApiGateway.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-internal-gateway.InternalApiGateway.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-internal-gateway.InternalApiGatewayProps">InternalApiGatewayProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-internal-gateway.InternalApiGateway.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-internal-gateway.InternalApiGateway.isConstruct"></a>

```typescript
import { InternalApiGateway } from 'cdk-internal-gateway'

InternalApiGateway.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-internal-gateway.InternalApiGateway.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGateway.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-internal-gateway.InternalApiGateway.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


### InternalService <a name="InternalService" id="cdk-internal-gateway.InternalService"></a>

#### Initializers <a name="Initializers" id="cdk-internal-gateway.InternalService.Initializer"></a>

```typescript
import { InternalService } from 'cdk-internal-gateway'

new InternalService(scope: Construct, id: string, props: InternalServiceProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalService.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalService.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalService.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-internal-gateway.InternalServiceProps">InternalServiceProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-internal-gateway.InternalService.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-internal-gateway.InternalService.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-internal-gateway.InternalService.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-internal-gateway.InternalServiceProps">InternalServiceProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalService.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-internal-gateway.InternalService.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalService.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-internal-gateway.InternalService.isConstruct"></a>

```typescript
import { InternalService } from 'cdk-internal-gateway'

InternalService.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-internal-gateway.InternalService.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalService.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-internal-gateway.InternalService.property.domains">domains</a></code> | <code>aws-cdk-lib.aws_apigateway.IDomainName[]</code> | List of domains created by the internal service stack and shared with the api gateway stack. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-internal-gateway.InternalService.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `domains`<sup>Required</sup> <a name="domains" id="cdk-internal-gateway.InternalService.property.domains"></a>

```typescript
public readonly domains: IDomainName[];
```

- *Type:* aws-cdk-lib.aws_apigateway.IDomainName[]

List of domains created by the internal service stack and shared with the api gateway stack.

---


### InternalWebsite <a name="InternalWebsite" id="cdk-internal-gateway.InternalWebsite"></a>

#### Initializers <a name="Initializers" id="cdk-internal-gateway.InternalWebsite.Initializer"></a>

```typescript
import { InternalWebsite } from 'cdk-internal-gateway'

new InternalWebsite(scope: Construct, id: string, props: InternalWebsiteProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalWebsite.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalWebsite.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-internal-gateway.InternalWebsite.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-internal-gateway.InternalWebsiteProps">InternalWebsiteProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-internal-gateway.InternalWebsite.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-internal-gateway.InternalWebsite.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-internal-gateway.InternalWebsite.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-internal-gateway.InternalWebsiteProps">InternalWebsiteProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalWebsite.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-internal-gateway.InternalWebsite.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-internal-gateway.InternalWebsite.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-internal-gateway.InternalWebsite.isConstruct"></a>

```typescript
import { InternalWebsite } from 'cdk-internal-gateway'

InternalWebsite.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-internal-gateway.InternalWebsite.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalWebsite.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-internal-gateway.InternalWebsite.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### InternalApiGatewayProps <a name="InternalApiGatewayProps" id="cdk-internal-gateway.InternalApiGatewayProps"></a>

Properties for ApiGateway Includes all properties of RestApiProps except: endpointConfiguration, policy This is done by intention to prevent the user from overriding the required security settings.

#### Initializer <a name="Initializer" id="cdk-internal-gateway.InternalApiGatewayProps.Initializer"></a>

```typescript
import { InternalApiGatewayProps } from 'cdk-internal-gateway'

const internalApiGatewayProps: InternalApiGatewayProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.defaultCorsPreflightOptions">defaultCorsPreflightOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.CorsOptions</code> | Adds a CORS preflight OPTIONS method to this resource and all child resources. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.defaultIntegration">defaultIntegration</a></code> | <code>aws-cdk-lib.aws_apigateway.Integration</code> | An integration to use as a default for all methods created within this API unless an integration is specified. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.defaultMethodOptions">defaultMethodOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.MethodOptions</code> | Method options to use as a default for all methods created within this API unless custom options are specified. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.cloudWatchRole">cloudWatchRole</a></code> | <code>boolean</code> | Automatically configure an AWS CloudWatch role for API Gateway. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.deploy">deploy</a></code> | <code>boolean</code> | Indicates if a Deployment should be automatically created for this API, and recreated when the API model (resources, methods) changes. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.deployOptions">deployOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.StageOptions</code> | Options for the API Gateway stage that will always point to the latest deployment when `deploy` is enabled. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.description">description</a></code> | <code>string</code> | A description of the RestApi construct. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.disableExecuteApiEndpoint">disableExecuteApiEndpoint</a></code> | <code>boolean</code> | Specifies whether clients can invoke the API using the default execute-api endpoint. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.domainName">domainName</a></code> | <code>aws-cdk-lib.aws_apigateway.DomainNameOptions</code> | Configure a custom domain name and map it to this API. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.endpointExportName">endpointExportName</a></code> | <code>string</code> | Export name for the CfnOutput containing the API endpoint. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.endpointTypes">endpointTypes</a></code> | <code>aws-cdk-lib.aws_apigateway.EndpointType[]</code> | A list of the endpoint types of the API. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.failOnWarnings">failOnWarnings</a></code> | <code>boolean</code> | Indicates whether to roll back the resource if a warning occurs while API Gateway is creating the RestApi resource. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.parameters">parameters</a></code> | <code>{[ key: string ]: string}</code> | Custom header parameters for the request. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_iam.PolicyDocument</code> | A policy document that contains the permissions for this RestApi. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.restApiName">restApiName</a></code> | <code>string</code> | A name for the API Gateway RestApi resource. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.retainDeployments">retainDeployments</a></code> | <code>boolean</code> | Retains old deployment resources when the API changes. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.apiKeySourceType">apiKeySourceType</a></code> | <code>aws-cdk-lib.aws_apigateway.ApiKeySourceType</code> | The source of the API key for metering requests according to a usage plan. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.binaryMediaTypes">binaryMediaTypes</a></code> | <code>string[]</code> | The list of binary media mime-types that are supported by the RestApi resource, such as "image/png" or "application/octet-stream". |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.cloneFrom">cloneFrom</a></code> | <code>aws-cdk-lib.aws_apigateway.IRestApi</code> | The ID of the API Gateway RestApi resource that you want to clone. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.endpointConfiguration">endpointConfiguration</a></code> | <code>aws-cdk-lib.aws_apigateway.EndpointConfiguration</code> | The EndpointConfiguration property type specifies the endpoint types of a REST API. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.minCompressionSize">minCompressionSize</a></code> | <code>aws-cdk-lib.Size</code> | A Size(in bytes, kibibytes, mebibytes etc) that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.minimumCompressionSize">minimumCompressionSize</a></code> | <code>number</code> | A nullable integer that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.domains">domains</a></code> | <code>aws-cdk-lib.aws_apigateway.IDomainName[]</code> | List of custom domains names to be used for the API Gateway. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.vpcEndpoint">vpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IInterfaceVpcEndpoint</code> | VPC endpoint id of execute-api vpc endpoint. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.apiBasePathMappingPath">apiBasePathMappingPath</a></code> | <code>string</code> | Path for custom domain base path mapping that will be attached to the api gateway. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.stage">stage</a></code> | <code>string</code> | Stage name  used for all cloudformation resource names and internal aws resource names. |

---

##### `defaultCorsPreflightOptions`<sup>Optional</sup> <a name="defaultCorsPreflightOptions" id="cdk-internal-gateway.InternalApiGatewayProps.property.defaultCorsPreflightOptions"></a>

```typescript
public readonly defaultCorsPreflightOptions: CorsOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.CorsOptions
- *Default:* CORS is disabled

Adds a CORS preflight OPTIONS method to this resource and all child resources.

You can add CORS at the resource-level using `addCorsPreflight`.

---

##### `defaultIntegration`<sup>Optional</sup> <a name="defaultIntegration" id="cdk-internal-gateway.InternalApiGatewayProps.property.defaultIntegration"></a>

```typescript
public readonly defaultIntegration: Integration;
```

- *Type:* aws-cdk-lib.aws_apigateway.Integration
- *Default:* Inherited from parent.

An integration to use as a default for all methods created within this API unless an integration is specified.

---

##### `defaultMethodOptions`<sup>Optional</sup> <a name="defaultMethodOptions" id="cdk-internal-gateway.InternalApiGatewayProps.property.defaultMethodOptions"></a>

```typescript
public readonly defaultMethodOptions: MethodOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.MethodOptions
- *Default:* Inherited from parent.

Method options to use as a default for all methods created within this API unless custom options are specified.

---

##### `cloudWatchRole`<sup>Optional</sup> <a name="cloudWatchRole" id="cdk-internal-gateway.InternalApiGatewayProps.property.cloudWatchRole"></a>

```typescript
public readonly cloudWatchRole: boolean;
```

- *Type:* boolean
- *Default:* false if `@aws-cdk/aws-apigateway:disableCloudWatchRole` is enabled, true otherwise

Automatically configure an AWS CloudWatch role for API Gateway.

---

##### `deploy`<sup>Optional</sup> <a name="deploy" id="cdk-internal-gateway.InternalApiGatewayProps.property.deploy"></a>

```typescript
public readonly deploy: boolean;
```

- *Type:* boolean
- *Default:* true

Indicates if a Deployment should be automatically created for this API, and recreated when the API model (resources, methods) changes.

Since API Gateway deployments are immutable, When this option is enabled
(by default), an AWS::ApiGateway::Deployment resource will automatically
created with a logical ID that hashes the API model (methods, resources
and options). This means that when the model changes, the logical ID of
this CloudFormation resource will change, and a new deployment will be
created.

If this is set, `latestDeployment` will refer to the `Deployment` object
and `deploymentStage` will refer to a `Stage` that points to this
deployment. To customize the stage options, use the `deployOptions`
property.

A CloudFormation Output will also be defined with the root URL endpoint
of this REST API.

---

##### `deployOptions`<sup>Optional</sup> <a name="deployOptions" id="cdk-internal-gateway.InternalApiGatewayProps.property.deployOptions"></a>

```typescript
public readonly deployOptions: StageOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.StageOptions
- *Default:* Based on defaults of `StageOptions`.

Options for the API Gateway stage that will always point to the latest deployment when `deploy` is enabled.

If `deploy` is disabled,
this value cannot be set.

---

##### `description`<sup>Optional</sup> <a name="description" id="cdk-internal-gateway.InternalApiGatewayProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* 'Automatically created by the RestApi construct'

A description of the RestApi construct.

---

##### `disableExecuteApiEndpoint`<sup>Optional</sup> <a name="disableExecuteApiEndpoint" id="cdk-internal-gateway.InternalApiGatewayProps.property.disableExecuteApiEndpoint"></a>

```typescript
public readonly disableExecuteApiEndpoint: boolean;
```

- *Type:* boolean
- *Default:* false

Specifies whether clients can invoke the API using the default execute-api endpoint.

To require that clients use a custom domain name to invoke the
API, disable the default endpoint.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-restapi.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-restapi.html)

---

##### `domainName`<sup>Optional</sup> <a name="domainName" id="cdk-internal-gateway.InternalApiGatewayProps.property.domainName"></a>

```typescript
public readonly domainName: DomainNameOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.DomainNameOptions
- *Default:* no domain name is defined, use `addDomainName` or directly define a `DomainName`.

Configure a custom domain name and map it to this API.

---

##### `endpointExportName`<sup>Optional</sup> <a name="endpointExportName" id="cdk-internal-gateway.InternalApiGatewayProps.property.endpointExportName"></a>

```typescript
public readonly endpointExportName: string;
```

- *Type:* string
- *Default:* when no export name is given, output will be created without export

Export name for the CfnOutput containing the API endpoint.

---

##### `endpointTypes`<sup>Optional</sup> <a name="endpointTypes" id="cdk-internal-gateway.InternalApiGatewayProps.property.endpointTypes"></a>

```typescript
public readonly endpointTypes: EndpointType[];
```

- *Type:* aws-cdk-lib.aws_apigateway.EndpointType[]
- *Default:* EndpointType.EDGE

A list of the endpoint types of the API.

Use this property when creating
an API.

---

##### `failOnWarnings`<sup>Optional</sup> <a name="failOnWarnings" id="cdk-internal-gateway.InternalApiGatewayProps.property.failOnWarnings"></a>

```typescript
public readonly failOnWarnings: boolean;
```

- *Type:* boolean
- *Default:* false

Indicates whether to roll back the resource if a warning occurs while API Gateway is creating the RestApi resource.

---

##### `parameters`<sup>Optional</sup> <a name="parameters" id="cdk-internal-gateway.InternalApiGatewayProps.property.parameters"></a>

```typescript
public readonly parameters: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No parameters.

Custom header parameters for the request.

> [https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html](https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html)

---

##### `policy`<sup>Optional</sup> <a name="policy" id="cdk-internal-gateway.InternalApiGatewayProps.property.policy"></a>

```typescript
public readonly policy: PolicyDocument;
```

- *Type:* aws-cdk-lib.aws_iam.PolicyDocument
- *Default:* No policy.

A policy document that contains the permissions for this RestApi.

---

##### `restApiName`<sup>Optional</sup> <a name="restApiName" id="cdk-internal-gateway.InternalApiGatewayProps.property.restApiName"></a>

```typescript
public readonly restApiName: string;
```

- *Type:* string
- *Default:* ID of the RestApi construct.

A name for the API Gateway RestApi resource.

---

##### `retainDeployments`<sup>Optional</sup> <a name="retainDeployments" id="cdk-internal-gateway.InternalApiGatewayProps.property.retainDeployments"></a>

```typescript
public readonly retainDeployments: boolean;
```

- *Type:* boolean
- *Default:* false

Retains old deployment resources when the API changes.

This allows
manually reverting stages to point to old deployments via the AWS
Console.

---

##### `apiKeySourceType`<sup>Optional</sup> <a name="apiKeySourceType" id="cdk-internal-gateway.InternalApiGatewayProps.property.apiKeySourceType"></a>

```typescript
public readonly apiKeySourceType: ApiKeySourceType;
```

- *Type:* aws-cdk-lib.aws_apigateway.ApiKeySourceType
- *Default:* Metering is disabled.

The source of the API key for metering requests according to a usage plan.

---

##### `binaryMediaTypes`<sup>Optional</sup> <a name="binaryMediaTypes" id="cdk-internal-gateway.InternalApiGatewayProps.property.binaryMediaTypes"></a>

```typescript
public readonly binaryMediaTypes: string[];
```

- *Type:* string[]
- *Default:* RestApi supports only UTF-8-encoded text payloads.

The list of binary media mime-types that are supported by the RestApi resource, such as "image/png" or "application/octet-stream".

---

##### `cloneFrom`<sup>Optional</sup> <a name="cloneFrom" id="cdk-internal-gateway.InternalApiGatewayProps.property.cloneFrom"></a>

```typescript
public readonly cloneFrom: IRestApi;
```

- *Type:* aws-cdk-lib.aws_apigateway.IRestApi
- *Default:* None.

The ID of the API Gateway RestApi resource that you want to clone.

---

##### `endpointConfiguration`<sup>Optional</sup> <a name="endpointConfiguration" id="cdk-internal-gateway.InternalApiGatewayProps.property.endpointConfiguration"></a>

```typescript
public readonly endpointConfiguration: EndpointConfiguration;
```

- *Type:* aws-cdk-lib.aws_apigateway.EndpointConfiguration
- *Default:* EndpointType.EDGE

The EndpointConfiguration property type specifies the endpoint types of a REST API.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-apigateway-restapi-endpointconfiguration.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-apigateway-restapi-endpointconfiguration.html)

---

##### `minCompressionSize`<sup>Optional</sup> <a name="minCompressionSize" id="cdk-internal-gateway.InternalApiGatewayProps.property.minCompressionSize"></a>

```typescript
public readonly minCompressionSize: Size;
```

- *Type:* aws-cdk-lib.Size
- *Default:* Compression is disabled.

A Size(in bytes, kibibytes, mebibytes etc) that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API.

When compression is enabled, compression or
decompression is not applied on the payload if the payload size is
smaller than this value. Setting it to zero allows compression for any
payload size.

---

##### ~~`minimumCompressionSize`~~<sup>Optional</sup> <a name="minimumCompressionSize" id="cdk-internal-gateway.InternalApiGatewayProps.property.minimumCompressionSize"></a>

- *Deprecated:* - superseded by `minCompressionSize`

```typescript
public readonly minimumCompressionSize: number;
```

- *Type:* number
- *Default:* Compression is disabled.

A nullable integer that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API.

When compression is enabled, compression or
decompression is not applied on the payload if the payload size is
smaller than this value. Setting it to zero allows compression for any
payload size.

---

##### `domains`<sup>Required</sup> <a name="domains" id="cdk-internal-gateway.InternalApiGatewayProps.property.domains"></a>

```typescript
public readonly domains: IDomainName[];
```

- *Type:* aws-cdk-lib.aws_apigateway.IDomainName[]

List of custom domains names to be used for the API Gateway.

---

##### `vpcEndpoint`<sup>Required</sup> <a name="vpcEndpoint" id="cdk-internal-gateway.InternalApiGatewayProps.property.vpcEndpoint"></a>

```typescript
public readonly vpcEndpoint: IInterfaceVpcEndpoint;
```

- *Type:* aws-cdk-lib.aws_ec2.IInterfaceVpcEndpoint

VPC endpoint id of execute-api vpc endpoint.

This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.

---

##### `apiBasePathMappingPath`<sup>Optional</sup> <a name="apiBasePathMappingPath" id="cdk-internal-gateway.InternalApiGatewayProps.property.apiBasePathMappingPath"></a>

```typescript
public readonly apiBasePathMappingPath: string;
```

- *Type:* string

Path for custom domain base path mapping that will be attached to the api gateway.

---

##### ~~`stage`~~<sup>Optional</sup> <a name="stage" id="cdk-internal-gateway.InternalApiGatewayProps.property.stage"></a>

- *Deprecated:* use deployOptions.stageName instead

```typescript
public readonly stage: string;
```

- *Type:* string

Stage name  used for all cloudformation resource names and internal aws resource names.

---

### InternalServiceProps <a name="InternalServiceProps" id="cdk-internal-gateway.InternalServiceProps"></a>

Properties for InternalService.

#### Initializer <a name="Initializer" id="cdk-internal-gateway.InternalServiceProps.Initializer"></a>

```typescript
import { InternalServiceProps } from 'cdk-internal-gateway'

const internalServiceProps: InternalServiceProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.hostedZone">hostedZone</a></code> | <code>aws-cdk-lib.aws_route53.IHostedZone</code> | Hosted zone that will be used for the custom domain. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subDomain">subDomain</a></code> | <code>string</code> | Subdomain attached to hosted zone name. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subjectAlternativeNames">subjectAlternativeNames</a></code> | <code>string[]</code> | List of alternative domains attached to the solution. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subnetSelection">subnetSelection</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | Subnets attached to the application load balancer. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | VPC attached to the application load balancer. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.vpcEndpointIPAddresses">vpcEndpointIPAddresses</a></code> | <code>string[]</code> | VPC endpoint ip addresses attached to the load balancer`s target group. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.addLoadBalancerRedirect">addLoadBalancerRedirect</a></code> | <code>boolean</code> | Add load balancer redirect from port 80 to 443. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.customDomainSSLPolicy">customDomainSSLPolicy</a></code> | <code>aws-cdk-lib.aws_apigateway.SecurityPolicy</code> | SSLPolicy attached to the apigateway custom domain. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.enableLoadBalancerAccessLogs">enableLoadBalancerAccessLogs</a></code> | <code>boolean</code> | Enable or disable access logs for the load balancer to follow AWS best practices for security. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.loadBalancerListenerSSLPolicy">loadBalancerListenerSSLPolicy</a></code> | <code>aws-cdk-lib.aws_elasticloadbalancingv2.SslPolicy</code> | SSLPolicy attached to the load balancer listener. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.loadBalancerSecurityGroup">loadBalancerSecurityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | Use a custom security group used for the load balancer. |

---

##### `hostedZone`<sup>Required</sup> <a name="hostedZone" id="cdk-internal-gateway.InternalServiceProps.property.hostedZone"></a>

```typescript
public readonly hostedZone: IHostedZone;
```

- *Type:* aws-cdk-lib.aws_route53.IHostedZone

Hosted zone that will be used for the custom domain.

---

##### `subDomain`<sup>Required</sup> <a name="subDomain" id="cdk-internal-gateway.InternalServiceProps.property.subDomain"></a>

```typescript
public readonly subDomain: string;
```

- *Type:* string

Subdomain attached to hosted zone name.

---

##### `subjectAlternativeNames`<sup>Required</sup> <a name="subjectAlternativeNames" id="cdk-internal-gateway.InternalServiceProps.property.subjectAlternativeNames"></a>

```typescript
public readonly subjectAlternativeNames: string[];
```

- *Type:* string[]

List of alternative domains attached to the solution.

---

##### `subnetSelection`<sup>Required</sup> <a name="subnetSelection" id="cdk-internal-gateway.InternalServiceProps.property.subnetSelection"></a>

```typescript
public readonly subnetSelection: SubnetSelection;
```

- *Type:* aws-cdk-lib.aws_ec2.SubnetSelection

Subnets attached to the application load balancer.

---

##### `vpc`<sup>Required</sup> <a name="vpc" id="cdk-internal-gateway.InternalServiceProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

VPC attached to the application load balancer.

---

##### `vpcEndpointIPAddresses`<sup>Required</sup> <a name="vpcEndpointIPAddresses" id="cdk-internal-gateway.InternalServiceProps.property.vpcEndpointIPAddresses"></a>

```typescript
public readonly vpcEndpointIPAddresses: string[];
```

- *Type:* string[]

VPC endpoint ip addresses attached to the load balancer`s target group.

---

##### `addLoadBalancerRedirect`<sup>Optional</sup> <a name="addLoadBalancerRedirect" id="cdk-internal-gateway.InternalServiceProps.property.addLoadBalancerRedirect"></a>

```typescript
public readonly addLoadBalancerRedirect: boolean;
```

- *Type:* boolean
- *Default:* true

Add load balancer redirect from port 80 to 443.

---

##### `customDomainSSLPolicy`<sup>Optional</sup> <a name="customDomainSSLPolicy" id="cdk-internal-gateway.InternalServiceProps.property.customDomainSSLPolicy"></a>

```typescript
public readonly customDomainSSLPolicy: SecurityPolicy;
```

- *Type:* aws-cdk-lib.aws_apigateway.SecurityPolicy
- *Default:* apigateway.SslPolicy.TLS_1_2

SSLPolicy attached to the apigateway custom domain.

---

##### `enableLoadBalancerAccessLogs`<sup>Optional</sup> <a name="enableLoadBalancerAccessLogs" id="cdk-internal-gateway.InternalServiceProps.property.enableLoadBalancerAccessLogs"></a>

```typescript
public readonly enableLoadBalancerAccessLogs: boolean;
```

- *Type:* boolean
- *Default:* true

Enable or disable access logs for the load balancer to follow AWS best practices for security.

---

##### `loadBalancerListenerSSLPolicy`<sup>Optional</sup> <a name="loadBalancerListenerSSLPolicy" id="cdk-internal-gateway.InternalServiceProps.property.loadBalancerListenerSSLPolicy"></a>

```typescript
public readonly loadBalancerListenerSSLPolicy: SslPolicy;
```

- *Type:* aws-cdk-lib.aws_elasticloadbalancingv2.SslPolicy
- *Default:* elb.SslPolicy.FORWARD_SECRECY_TLS12_RES_GCM

SSLPolicy attached to the load balancer listener.

---

##### `loadBalancerSecurityGroup`<sup>Optional</sup> <a name="loadBalancerSecurityGroup" id="cdk-internal-gateway.InternalServiceProps.property.loadBalancerSecurityGroup"></a>

```typescript
public readonly loadBalancerSecurityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup

Use a custom security group used for the load balancer.

By default, a security group will be created with inbound access to the typical private network CIDR ranges 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 and port 443.
Any inbound access (0.0.0.0/0) is blocked by default to follow AWS best practices for security.
Outbound traffic is allowed to all destinations.

---

### InternalWebsiteProps <a name="InternalWebsiteProps" id="cdk-internal-gateway.InternalWebsiteProps"></a>

Properties for InternalService.

#### Initializer <a name="Initializer" id="cdk-internal-gateway.InternalWebsiteProps.Initializer"></a>

```typescript
import { InternalWebsiteProps } from 'cdk-internal-gateway'

const internalWebsiteProps: InternalWebsiteProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.defaultCorsPreflightOptions">defaultCorsPreflightOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.CorsOptions</code> | Adds a CORS preflight OPTIONS method to this resource and all child resources. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.defaultIntegration">defaultIntegration</a></code> | <code>aws-cdk-lib.aws_apigateway.Integration</code> | An integration to use as a default for all methods created within this API unless an integration is specified. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.defaultMethodOptions">defaultMethodOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.MethodOptions</code> | Method options to use as a default for all methods created within this API unless custom options are specified. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.cloudWatchRole">cloudWatchRole</a></code> | <code>boolean</code> | Automatically configure an AWS CloudWatch role for API Gateway. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.deploy">deploy</a></code> | <code>boolean</code> | Indicates if a Deployment should be automatically created for this API, and recreated when the API model (resources, methods) changes. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.deployOptions">deployOptions</a></code> | <code>aws-cdk-lib.aws_apigateway.StageOptions</code> | Options for the API Gateway stage that will always point to the latest deployment when `deploy` is enabled. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.description">description</a></code> | <code>string</code> | A description of the RestApi construct. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.disableExecuteApiEndpoint">disableExecuteApiEndpoint</a></code> | <code>boolean</code> | Specifies whether clients can invoke the API using the default execute-api endpoint. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.domainName">domainName</a></code> | <code>aws-cdk-lib.aws_apigateway.DomainNameOptions</code> | Configure a custom domain name and map it to this API. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.endpointExportName">endpointExportName</a></code> | <code>string</code> | Export name for the CfnOutput containing the API endpoint. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.endpointTypes">endpointTypes</a></code> | <code>aws-cdk-lib.aws_apigateway.EndpointType[]</code> | A list of the endpoint types of the API. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.failOnWarnings">failOnWarnings</a></code> | <code>boolean</code> | Indicates whether to roll back the resource if a warning occurs while API Gateway is creating the RestApi resource. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.parameters">parameters</a></code> | <code>{[ key: string ]: string}</code> | Custom header parameters for the request. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_iam.PolicyDocument</code> | A policy document that contains the permissions for this RestApi. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.restApiName">restApiName</a></code> | <code>string</code> | A name for the API Gateway RestApi resource. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.retainDeployments">retainDeployments</a></code> | <code>boolean</code> | Retains old deployment resources when the API changes. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.apiKeySourceType">apiKeySourceType</a></code> | <code>aws-cdk-lib.aws_apigateway.ApiKeySourceType</code> | The source of the API key for metering requests according to a usage plan. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.binaryMediaTypes">binaryMediaTypes</a></code> | <code>string[]</code> | The list of binary media mime-types that are supported by the RestApi resource, such as "image/png" or "application/octet-stream". |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.cloneFrom">cloneFrom</a></code> | <code>aws-cdk-lib.aws_apigateway.IRestApi</code> | The ID of the API Gateway RestApi resource that you want to clone. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.endpointConfiguration">endpointConfiguration</a></code> | <code>aws-cdk-lib.aws_apigateway.EndpointConfiguration</code> | The EndpointConfiguration property type specifies the endpoint types of a REST API. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.minCompressionSize">minCompressionSize</a></code> | <code>aws-cdk-lib.Size</code> | A Size(in bytes, kibibytes, mebibytes etc) that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.minimumCompressionSize">minimumCompressionSize</a></code> | <code>number</code> | A nullable integer that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.domains">domains</a></code> | <code>aws-cdk-lib.aws_apigateway.IDomainName[]</code> | List of custom domains names to be used for the API Gateway. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.vpcEndpoint">vpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IInterfaceVpcEndpoint</code> | VPC endpoint id of execute-api vpc endpoint. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.apiBasePathMappingPath">apiBasePathMappingPath</a></code> | <code>string</code> | Path for custom domain base path mapping that will be attached to the api gateway. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.stage">stage</a></code> | <code>string</code> | Stage name  used for all cloudformation resource names and internal aws resource names. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.sourcePath">sourcePath</a></code> | <code>string</code> | Path of website folder containing the website`s sources. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.bucketName">bucketName</a></code> | <code>string</code> | Name of s3 bucket to use for the website deployment. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.enableSourceDeployment">enableSourceDeployment</a></code> | <code>boolean</code> | Enable/disable automatic sync of the website`s sources to the S3bucket. |
| <code><a href="#cdk-internal-gateway.InternalWebsiteProps.property.websiteIndexDocument">websiteIndexDocument</a></code> | <code>string</code> | Name of html index document used for the website. |

---

##### `defaultCorsPreflightOptions`<sup>Optional</sup> <a name="defaultCorsPreflightOptions" id="cdk-internal-gateway.InternalWebsiteProps.property.defaultCorsPreflightOptions"></a>

```typescript
public readonly defaultCorsPreflightOptions: CorsOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.CorsOptions
- *Default:* CORS is disabled

Adds a CORS preflight OPTIONS method to this resource and all child resources.

You can add CORS at the resource-level using `addCorsPreflight`.

---

##### `defaultIntegration`<sup>Optional</sup> <a name="defaultIntegration" id="cdk-internal-gateway.InternalWebsiteProps.property.defaultIntegration"></a>

```typescript
public readonly defaultIntegration: Integration;
```

- *Type:* aws-cdk-lib.aws_apigateway.Integration
- *Default:* Inherited from parent.

An integration to use as a default for all methods created within this API unless an integration is specified.

---

##### `defaultMethodOptions`<sup>Optional</sup> <a name="defaultMethodOptions" id="cdk-internal-gateway.InternalWebsiteProps.property.defaultMethodOptions"></a>

```typescript
public readonly defaultMethodOptions: MethodOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.MethodOptions
- *Default:* Inherited from parent.

Method options to use as a default for all methods created within this API unless custom options are specified.

---

##### `cloudWatchRole`<sup>Optional</sup> <a name="cloudWatchRole" id="cdk-internal-gateway.InternalWebsiteProps.property.cloudWatchRole"></a>

```typescript
public readonly cloudWatchRole: boolean;
```

- *Type:* boolean
- *Default:* false if `@aws-cdk/aws-apigateway:disableCloudWatchRole` is enabled, true otherwise

Automatically configure an AWS CloudWatch role for API Gateway.

---

##### `deploy`<sup>Optional</sup> <a name="deploy" id="cdk-internal-gateway.InternalWebsiteProps.property.deploy"></a>

```typescript
public readonly deploy: boolean;
```

- *Type:* boolean
- *Default:* true

Indicates if a Deployment should be automatically created for this API, and recreated when the API model (resources, methods) changes.

Since API Gateway deployments are immutable, When this option is enabled
(by default), an AWS::ApiGateway::Deployment resource will automatically
created with a logical ID that hashes the API model (methods, resources
and options). This means that when the model changes, the logical ID of
this CloudFormation resource will change, and a new deployment will be
created.

If this is set, `latestDeployment` will refer to the `Deployment` object
and `deploymentStage` will refer to a `Stage` that points to this
deployment. To customize the stage options, use the `deployOptions`
property.

A CloudFormation Output will also be defined with the root URL endpoint
of this REST API.

---

##### `deployOptions`<sup>Optional</sup> <a name="deployOptions" id="cdk-internal-gateway.InternalWebsiteProps.property.deployOptions"></a>

```typescript
public readonly deployOptions: StageOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.StageOptions
- *Default:* Based on defaults of `StageOptions`.

Options for the API Gateway stage that will always point to the latest deployment when `deploy` is enabled.

If `deploy` is disabled,
this value cannot be set.

---

##### `description`<sup>Optional</sup> <a name="description" id="cdk-internal-gateway.InternalWebsiteProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* 'Automatically created by the RestApi construct'

A description of the RestApi construct.

---

##### `disableExecuteApiEndpoint`<sup>Optional</sup> <a name="disableExecuteApiEndpoint" id="cdk-internal-gateway.InternalWebsiteProps.property.disableExecuteApiEndpoint"></a>

```typescript
public readonly disableExecuteApiEndpoint: boolean;
```

- *Type:* boolean
- *Default:* false

Specifies whether clients can invoke the API using the default execute-api endpoint.

To require that clients use a custom domain name to invoke the
API, disable the default endpoint.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-restapi.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-restapi.html)

---

##### `domainName`<sup>Optional</sup> <a name="domainName" id="cdk-internal-gateway.InternalWebsiteProps.property.domainName"></a>

```typescript
public readonly domainName: DomainNameOptions;
```

- *Type:* aws-cdk-lib.aws_apigateway.DomainNameOptions
- *Default:* no domain name is defined, use `addDomainName` or directly define a `DomainName`.

Configure a custom domain name and map it to this API.

---

##### `endpointExportName`<sup>Optional</sup> <a name="endpointExportName" id="cdk-internal-gateway.InternalWebsiteProps.property.endpointExportName"></a>

```typescript
public readonly endpointExportName: string;
```

- *Type:* string
- *Default:* when no export name is given, output will be created without export

Export name for the CfnOutput containing the API endpoint.

---

##### `endpointTypes`<sup>Optional</sup> <a name="endpointTypes" id="cdk-internal-gateway.InternalWebsiteProps.property.endpointTypes"></a>

```typescript
public readonly endpointTypes: EndpointType[];
```

- *Type:* aws-cdk-lib.aws_apigateway.EndpointType[]
- *Default:* EndpointType.EDGE

A list of the endpoint types of the API.

Use this property when creating
an API.

---

##### `failOnWarnings`<sup>Optional</sup> <a name="failOnWarnings" id="cdk-internal-gateway.InternalWebsiteProps.property.failOnWarnings"></a>

```typescript
public readonly failOnWarnings: boolean;
```

- *Type:* boolean
- *Default:* false

Indicates whether to roll back the resource if a warning occurs while API Gateway is creating the RestApi resource.

---

##### `parameters`<sup>Optional</sup> <a name="parameters" id="cdk-internal-gateway.InternalWebsiteProps.property.parameters"></a>

```typescript
public readonly parameters: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No parameters.

Custom header parameters for the request.

> [https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html](https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html)

---

##### `policy`<sup>Optional</sup> <a name="policy" id="cdk-internal-gateway.InternalWebsiteProps.property.policy"></a>

```typescript
public readonly policy: PolicyDocument;
```

- *Type:* aws-cdk-lib.aws_iam.PolicyDocument
- *Default:* No policy.

A policy document that contains the permissions for this RestApi.

---

##### `restApiName`<sup>Optional</sup> <a name="restApiName" id="cdk-internal-gateway.InternalWebsiteProps.property.restApiName"></a>

```typescript
public readonly restApiName: string;
```

- *Type:* string
- *Default:* ID of the RestApi construct.

A name for the API Gateway RestApi resource.

---

##### `retainDeployments`<sup>Optional</sup> <a name="retainDeployments" id="cdk-internal-gateway.InternalWebsiteProps.property.retainDeployments"></a>

```typescript
public readonly retainDeployments: boolean;
```

- *Type:* boolean
- *Default:* false

Retains old deployment resources when the API changes.

This allows
manually reverting stages to point to old deployments via the AWS
Console.

---

##### `apiKeySourceType`<sup>Optional</sup> <a name="apiKeySourceType" id="cdk-internal-gateway.InternalWebsiteProps.property.apiKeySourceType"></a>

```typescript
public readonly apiKeySourceType: ApiKeySourceType;
```

- *Type:* aws-cdk-lib.aws_apigateway.ApiKeySourceType
- *Default:* Metering is disabled.

The source of the API key for metering requests according to a usage plan.

---

##### `binaryMediaTypes`<sup>Optional</sup> <a name="binaryMediaTypes" id="cdk-internal-gateway.InternalWebsiteProps.property.binaryMediaTypes"></a>

```typescript
public readonly binaryMediaTypes: string[];
```

- *Type:* string[]
- *Default:* RestApi supports only UTF-8-encoded text payloads.

The list of binary media mime-types that are supported by the RestApi resource, such as "image/png" or "application/octet-stream".

---

##### `cloneFrom`<sup>Optional</sup> <a name="cloneFrom" id="cdk-internal-gateway.InternalWebsiteProps.property.cloneFrom"></a>

```typescript
public readonly cloneFrom: IRestApi;
```

- *Type:* aws-cdk-lib.aws_apigateway.IRestApi
- *Default:* None.

The ID of the API Gateway RestApi resource that you want to clone.

---

##### `endpointConfiguration`<sup>Optional</sup> <a name="endpointConfiguration" id="cdk-internal-gateway.InternalWebsiteProps.property.endpointConfiguration"></a>

```typescript
public readonly endpointConfiguration: EndpointConfiguration;
```

- *Type:* aws-cdk-lib.aws_apigateway.EndpointConfiguration
- *Default:* EndpointType.EDGE

The EndpointConfiguration property type specifies the endpoint types of a REST API.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-apigateway-restapi-endpointconfiguration.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-apigateway-restapi-endpointconfiguration.html)

---

##### `minCompressionSize`<sup>Optional</sup> <a name="minCompressionSize" id="cdk-internal-gateway.InternalWebsiteProps.property.minCompressionSize"></a>

```typescript
public readonly minCompressionSize: Size;
```

- *Type:* aws-cdk-lib.Size
- *Default:* Compression is disabled.

A Size(in bytes, kibibytes, mebibytes etc) that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API.

When compression is enabled, compression or
decompression is not applied on the payload if the payload size is
smaller than this value. Setting it to zero allows compression for any
payload size.

---

##### ~~`minimumCompressionSize`~~<sup>Optional</sup> <a name="minimumCompressionSize" id="cdk-internal-gateway.InternalWebsiteProps.property.minimumCompressionSize"></a>

- *Deprecated:* - superseded by `minCompressionSize`

```typescript
public readonly minimumCompressionSize: number;
```

- *Type:* number
- *Default:* Compression is disabled.

A nullable integer that is used to enable compression (with non-negative between 0 and 10485760 (10M) bytes, inclusive) or disable compression (when undefined) on an API.

When compression is enabled, compression or
decompression is not applied on the payload if the payload size is
smaller than this value. Setting it to zero allows compression for any
payload size.

---

##### `domains`<sup>Required</sup> <a name="domains" id="cdk-internal-gateway.InternalWebsiteProps.property.domains"></a>

```typescript
public readonly domains: IDomainName[];
```

- *Type:* aws-cdk-lib.aws_apigateway.IDomainName[]

List of custom domains names to be used for the API Gateway.

---

##### `vpcEndpoint`<sup>Required</sup> <a name="vpcEndpoint" id="cdk-internal-gateway.InternalWebsiteProps.property.vpcEndpoint"></a>

```typescript
public readonly vpcEndpoint: IInterfaceVpcEndpoint;
```

- *Type:* aws-cdk-lib.aws_ec2.IInterfaceVpcEndpoint

VPC endpoint id of execute-api vpc endpoint.

This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.

---

##### `apiBasePathMappingPath`<sup>Optional</sup> <a name="apiBasePathMappingPath" id="cdk-internal-gateway.InternalWebsiteProps.property.apiBasePathMappingPath"></a>

```typescript
public readonly apiBasePathMappingPath: string;
```

- *Type:* string

Path for custom domain base path mapping that will be attached to the api gateway.

---

##### ~~`stage`~~<sup>Optional</sup> <a name="stage" id="cdk-internal-gateway.InternalWebsiteProps.property.stage"></a>

- *Deprecated:* use deployOptions.stageName instead

```typescript
public readonly stage: string;
```

- *Type:* string

Stage name  used for all cloudformation resource names and internal aws resource names.

---

##### `sourcePath`<sup>Required</sup> <a name="sourcePath" id="cdk-internal-gateway.InternalWebsiteProps.property.sourcePath"></a>

```typescript
public readonly sourcePath: string;
```

- *Type:* string

Path of website folder containing the website`s sources.

---

##### `bucketName`<sup>Optional</sup> <a name="bucketName" id="cdk-internal-gateway.InternalWebsiteProps.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

Name of s3 bucket to use for the website deployment.

---

##### `enableSourceDeployment`<sup>Optional</sup> <a name="enableSourceDeployment" id="cdk-internal-gateway.InternalWebsiteProps.property.enableSourceDeployment"></a>

```typescript
public readonly enableSourceDeployment: boolean;
```

- *Type:* boolean
- *Default:* true

Enable/disable automatic sync of the website`s sources to the S3bucket.

---

##### `websiteIndexDocument`<sup>Optional</sup> <a name="websiteIndexDocument" id="cdk-internal-gateway.InternalWebsiteProps.property.websiteIndexDocument"></a>

```typescript
public readonly websiteIndexDocument: string;
```

- *Type:* string
- *Default:* index.html

Name of html index document used for the website.

---



