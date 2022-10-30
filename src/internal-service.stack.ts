import {
  aws_apigateway as apigateway,
  aws_certificatemanager as certificatemanager,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elb,
  aws_elasticloadbalancingv2_targets as elasticloadbalancingv2targets,
  aws_route53 as route53,
  aws_route53_targets as targets,
  CfnOutput,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Properties for InternalServiceStack
 */
export interface InternalServiceStackProps extends StackProps {
  /**
   * VPC attached to the application load balancer.
   */
  readonly vpcId: string;

  /**
   * Subnets attached to the application load balancer.
   */
  readonly internalSubnetIds: string[];

  /**
   * VPC endpoint id of execute-api vpc endpoint. This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.
   */
  readonly vpcEndpointId: string;

  /**
   * VPC endpoint ip addresses attached to the load balancer`s target group
   */
  readonly vpcEndpointIPAddresses?: Array<string>;

  /**
   * List of alternative domains attached to the solution.
   */
  readonly subjectAlternativeNames: string[];

  /**
   * Subdomain attached to hosted zone name.
   */
  readonly subDomain: string;

  /**
   * Name of hosted zone that will be used for the custom domain.
   */
  readonly hostedZoneName: string;
}

export class InternalServiceStack extends Stack {
  /**
   * List of domains created by the internal service stack and shared with the api gateway stack.
   */
  public readonly domains: apigateway.IDomainName[];

  /**
   * VPC Endpoint Id of the execute-api vpc endpoint.
   */
  public readonly vpcEndpointId: ec2.IInterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: InternalServiceStackProps) {
    super(scope, id, props);


    const existingVpc = ec2.Vpc.fromLookup(this, `${this.stackName}-VPC`, {
      vpcId: props.vpcId,
    });

    this.vpcEndpointId =
      ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
        this,
        `${this.stackName}-VPCEndpoint`,
        {
          port: 443,
          vpcEndpointId: props.vpcEndpointId,
        },
      );

    const domainName = `${props.subDomain}.${props.hostedZoneName}`;
    const hostedZone = route53.HostedZone.fromLookup(this, `${this.stackName}-HostedZone`, {
      domainName: `${props.hostedZoneName}`,
      privateZone: true,
      vpcId: existingVpc.vpcId,
    });

    const cert = new certificatemanager.Certificate(this, `${this.stackName}-SSLCertificate`, {
      domainName: domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validation: certificatemanager.CertificateValidation.fromDnsMultiZone({
        domainName: hostedZone,
      }),
    });

    const domain = new apigateway.DomainName(this, `${this.stackName}-ApiGatewayCustomDomain`, {
      domainName: `${props.subDomain}.${props.hostedZoneName}`,
      certificate: cert,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });
    this.domains = [domain];
    this.exportValue(domain.domainName);

    for (const domainItem of props.subjectAlternativeNames) {
      const sanDomain = new apigateway.DomainName(
        this,
        `${this.stackName}-domain-${domainItem}`,
        {
          domainName: domainItem,
          certificate: cert,
          endpointType: apigateway.EndpointType.REGIONAL,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        },
      );
      this.domains.push(sanDomain);
      this.exportValue(sanDomain.domainName);
    }

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      `${this.stackName}-LoadBalancerSecurityGroup`,
      {
        securityGroupName: `${this.stackName}-lb-sg`,
        vpc: existingVpc,
        allowAllOutbound: true,
        description: 'security group for a load balancer',
      },
    );

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    const alb = new elb.ApplicationLoadBalancer(
      this,
      `${this.stackName}-ApplicationLoadBalancer`,
      {
        vpc: existingVpc,
        vpcSubnets: {
          subnets: props.internalSubnetIds.map((subnetId, index) =>
            ec2.Subnet.fromSubnetId(this, `Subnet${index}`, subnetId),
          ),
        },
        internetFacing: false,
        securityGroup: loadBalancerSecurityGroup,
        loadBalancerName: `${this.stackName}-lb`,
      },
    );

    new route53.ARecord(this, `${this.stackName}-Route53Record`, {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb),
      ),
      recordName: domainName,
    });

    const targetGroupTargets: elasticloadbalancingv2targets.IpTarget[] = [];

    for (const ip of props.vpcEndpointIPAddresses!) {
      targetGroupTargets.push(new elasticloadbalancingv2targets.IpTarget(ip));
    }

    const targetGroup = new elb.ApplicationTargetGroup(this, `${this.stackName}-TargetGroup`, {
      port: 443,
      vpc: existingVpc,
      protocol: elb.ApplicationProtocol.HTTPS,
      targetType: elb.TargetType.IP,
      targets: targetGroupTargets,
      targetGroupName: `${this.stackName}-tg`,
    });

    const listener = alb.addListener(`${this.stackName}-Listener`, {
      port: 443,
      certificates: [cert],
    });

    listener.addTargetGroups(`${this.stackName}-TargetGroupAttachment`, {
      targetGroups: [targetGroup],
    });

    new CfnOutput(this, `${this.stackName}-DomainUrl`, {
      value: `https://${domainName}`,
      description: 'service url',
      exportName: `${this.stackName}-DomainUrl`,
    });
  }
}
