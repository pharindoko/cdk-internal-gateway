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
   * Service name  used for all cloudformation resource names and internal aws resource names.
   */
  readonly serviceName: string;

  /**
   * Stage name  used for all cloudformation resource names and internal aws resource names.
   */
  readonly stage: string;

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


    const existingVpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: false,
      region: props?.env?.region,
      vpcId: props.vpcId,
    });

    this.vpcEndpointId =
      ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
        this,
        'VPCEndpoint',
        {
          port: 443,
          vpcEndpointId: props.vpcEndpointId,
        },
      );
    const domainName = `${props.subDomain}.${props.hostedZoneName}`;
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
      privateZone: true,
    });

    const cert = new certificatemanager.Certificate(this, 'SSLCertificate', {
      domainName: domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validation: certificatemanager.CertificateValidation.fromDnsMultiZone({
        domainName: hostedZone,
      }),
    });

    const domain = new apigateway.DomainName(this, 'ApiGatewayCustomDomain', {
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
        `ApiGatewayCustomDomainSan${domainItem}`,
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
      'LoadBalancerSecurityGroup',
      {
        securityGroupName: `${props.serviceName}-${props.stage}-lb-sg`,
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
      'ApplicationLoadBalancer',
      {
        vpc: existingVpc,
        vpcSubnets: {
          subnets: props.internalSubnetIds.map((ip, index) =>
            ec2.Subnet.fromSubnetId(this, `Subnet${index}`, ip),
          ),
        },
        internetFacing: false,
        securityGroup: loadBalancerSecurityGroup,
        loadBalancerName: `${props.serviceName}-${props.stage}-lb`,
      },
    );

    new route53.ARecord(this, 'Route53Record', {
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

    const targetGroup = new elb.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 443,
      vpc: existingVpc,
      protocol: elb.ApplicationProtocol.HTTPS,
      targetType: elb.TargetType.IP,
      targets: targetGroupTargets,
      targetGroupName: `${props.serviceName}-${props.stage}-tg`,
    });

    const listener = alb.addListener('Listener', {
      port: 443,
      certificates: [cert],
    });

    listener.addTargetGroups('TargetGroupAttachment', {
      targetGroups: [targetGroup],
    });

    new CfnOutput(this, 'DomainUrl', {
      value: `https://${domainName}`,
      description: 'service url',
      exportName: `${props.serviceName}-${props.stage}-DomainUrl`,
    });
  }
}
