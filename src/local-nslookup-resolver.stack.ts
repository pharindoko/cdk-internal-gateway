import { promises } from 'dns';
import { Construct } from 'constructs';
import { VpcEndpointIPResolver, VPCEndpointResolverProps } from './vpc-endpoint-ip-resolver';

const resolver = new promises.Resolver({ timeout: 10000 });
/**
 * Properties for NSLookupResolverStack
 */
export interface NSLookupResolverProps extends VPCEndpointResolverProps {
  /**
         * DNS Name of execute-api vpc endpoint used for nslookup query.
         */
  readonly vpcEndpointDnsName: string;
}

/**
 * Stack that resolves the vpc endpoint ip addresses executing a local dns lookup.
 */
export class LocalNSLookupResolverStack extends VpcEndpointIPResolver {
  constructor(scope: Construct, id: string, props: NSLookupResolverProps) {
    super(scope, id, props);
    try {
      (async (): Promise<void> => {
        this.vcpEndpointIpAddresses = await resolver.resolve(props.vpcEndpointDnsName);
        this.setIpAddressesOutput();
      }
      )().catch((error) => {
        console.error(error);
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      throw error;
    };
  }
}
