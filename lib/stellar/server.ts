import { rpc } from "@stellar/stellar-sdk";
import { SOROBAN_RPC_URL } from "./config";

let _server: rpc.Server | null = null;

/** Cached Soroban RPC client. */
export function getServer(): rpc.Server {
  if (!_server) {
    _server = new rpc.Server(SOROBAN_RPC_URL, {
      allowHttp: SOROBAN_RPC_URL.startsWith("http://"),
    });
  }
  return _server;
}
