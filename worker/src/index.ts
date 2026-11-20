// Worker entry point. Only the default export may live here: Cloudflare treats every
// named export of this file as a handler. The logic is in ./handler.ts.
import { handle } from './handler';

export default { fetch: handle };
