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


## Structs <a name="Structs" id="Structs"></a>

### InternalApiGatewayProps <a name="InternalApiGatewayProps" id="cdk-internal-gateway.InternalApiGatewayProps"></a>

Properties for ApiGateway.

#### Initializer <a name="Initializer" id="cdk-internal-gateway.InternalApiGatewayProps.Initializer"></a>

```typescript
import { InternalApiGatewayProps } from 'cdk-internal-gateway'

const internalApiGatewayProps: InternalApiGatewayProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.domains">domains</a></code> | <code>aws-cdk-lib.aws_apigateway.IDomainName[]</code> | List of custom domains names to be used for the API Gateway. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.stage">stage</a></code> | <code>string</code> | Stage name  used for all cloudformation resource names and internal aws resource names. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.vpcEndpoint">vpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IInterfaceVpcEndpoint</code> | VPC endpoint id of execute-api vpc endpoint. |
| <code><a href="#cdk-internal-gateway.InternalApiGatewayProps.property.apiBasePathMappingPath">apiBasePathMappingPath</a></code> | <code>string</code> | Path for custom domain base path mapping that will be attached to the api gateway. |

---

##### `domains`<sup>Required</sup> <a name="domains" id="cdk-internal-gateway.InternalApiGatewayProps.property.domains"></a>

```typescript
public readonly domains: IDomainName[];
```

- *Type:* aws-cdk-lib.aws_apigateway.IDomainName[]

List of custom domains names to be used for the API Gateway.

---

##### `stage`<sup>Required</sup> <a name="stage" id="cdk-internal-gateway.InternalApiGatewayProps.property.stage"></a>

```typescript
public readonly stage: string;
```

- *Type:* string

Stage name  used for all cloudformation resource names and internal aws resource names.

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
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.hostedZoneName">hostedZoneName</a></code> | <code>string</code> | Name of hosted zone that will be used for the custom domain. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subDomain">subDomain</a></code> | <code>string</code> | Subdomain attached to hosted zone name. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subjectAlternativeNames">subjectAlternativeNames</a></code> | <code>string[]</code> | List of alternative domains attached to the solution. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.subnetSelection">subnetSelection</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | Subnets attached to the application load balancer. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | VPC attached to the application load balancer. |
| <code><a href="#cdk-internal-gateway.InternalServiceProps.property.vpcEndpointIPAddresses">vpcEndpointIPAddresses</a></code> | <code>string[]</code> | VPC endpoint ip addresses attached to the load balancer`s target group. |

---

##### `hostedZoneName`<sup>Required</sup> <a name="hostedZoneName" id="cdk-internal-gateway.InternalServiceProps.property.hostedZoneName"></a>

```typescript
public readonly hostedZoneName: string;
```

- *Type:* string

Name of hosted zone that will be used for the custom domain.

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



