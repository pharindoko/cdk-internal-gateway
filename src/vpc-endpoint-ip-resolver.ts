import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';

export abstract class VpcEndpointIPResolver extends Stack {
  /**
     * Ip Addresses of the vpc endpoint used to forward requests from the load balancer`s target group to the internal api gateway.
     */
  public vcpEndpointIpAddresses: string[] | undefined;

  setIpAddressesOutput(): void {
    const addresses = this.vcpEndpointIpAddresses!;
    for (let i = 0; i < addresses.length; i++) {
      new CfnOutput(this, `VPCEndpointIpAddress${i}`, {
        value: addresses[i],
        description: 'VPC Endpoint IP Address ',
      });
    }
  }
}

/**
 * Properties for VpcEndpointResolver
 */
export interface VPCEndpointResolverProps extends StackProps {
  /**
     * Service name  used for all cloudformation resource names and internal aws resource names.
     */
  readonly serviceName: string;

  /**
     * Stage name  used for all cloudformation resource names and internal aws resource names.
     */
  readonly stage: string;
}