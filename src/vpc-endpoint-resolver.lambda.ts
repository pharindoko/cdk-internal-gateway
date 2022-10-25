import { promises as dnsPromises } from "dns";

export async function handler() {
    const response = await dnsPromises.resolveSrv(process.env.VPC_ENDPOINT_URL!);
    return response.sort();
}

