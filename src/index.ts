import * as check from './check';
import * as clock from './clock';
import * as eventemitter from './event-emitter';
import * as match from './match';
import * as math from './math';
import * as sleep from './sleep';
import * as statestack from './statestack';
import * as status from './status';
import * as stream from './stream';
import * as text from './text';

export default {
    ...check,
    ...clock,
    ...eventemitter,
    ...match,
    ...math,
    ...sleep,
    ...statestack,
    ...status,
    ...stream,
    ...text
}